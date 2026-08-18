import { NextResponse } from 'next/server';
import { client } from '@/sanity/lib/client';
import resend from '@/lib/resend';
import { DispatchReminderEmailTemplate, type DispatchOrderItem } from '@/components/emails/dispatch-reminder-template';

export const dynamic = 'force-dynamic';

// Helper to convert date to Colombia timezone parts
function getColombiaDateParts(date: Date) {
  const formatter = new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const partMap: Record<string, string> = {};
  parts.forEach(p => {
    partMap[p.type] = p.value;
  });

  return {
    year: parseInt(partMap.year, 10),
    month: parseInt(partMap.month, 10),
    day: parseInt(partMap.day, 10),
    hour: parseInt(partMap.hour, 10),
    minute: parseInt(partMap.minute, 10),
    second: parseInt(partMap.second, 10),
  };
}

// Calculate deadline for an order according to the rule:
// - If placed before 1:00 PM (13:00 COT): Dispatched SAME DAY (Deadline: 17:00 COT)
// - If placed at or after 1:00 PM (13:00 COT): Dispatched NEXT DAY (Deadline: Next day 17:00 COT)
function calculateOrderDispatchDeadline(orderDateUtc: Date, cutoffHour: number = 13) {
  const parts = getColombiaDateParts(orderDateUtc);
  const isBeforeCutoff = parts.hour < cutoffHour;

  // Build target date in Colombia time
  // Using ISO string representation with Colombia offset (-05:00)
  const targetYear = parts.year;
  const targetMonth = String(parts.month).padStart(2, '0');
  const targetDay = parts.day;

  // Create Date object representing midnight in Colombia for the order date
  const orderDateCol = new Date(`${targetYear}-${targetMonth}-${String(targetDay).padStart(2, '0')}T00:00:00-05:00`);

  let deadlineDateCol = new Date(orderDateCol);
  if (!isBeforeCutoff) {
    // Add 1 day
    deadlineDateCol.setDate(deadlineDateCol.getDate() + 1);
    // If Sunday (0), shift to Monday
    if (deadlineDateCol.getDay() === 0) {
      deadlineDateCol.setDate(deadlineDateCol.getDate() + 1);
    }
  } else {
    // If order was placed on Sunday, deadline is Monday
    if (deadlineDateCol.getDay() === 0) {
      deadlineDateCol.setDate(deadlineDateCol.getDate() + 1);
    }
  }

  // Set deadline time to 5:00 PM (17:00) COT
  const dYear = deadlineDateCol.getFullYear();
  const dMonth = String(deadlineDateCol.getMonth() + 1).padStart(2, '0');
  const dDay = String(deadlineDateCol.getDate()).padStart(2, '0');
  const deadlineUtc = new Date(`${dYear}-${dMonth}-${dDay}T17:00:00-05:00`);

  return {
    isSameDayDispatch: isBeforeCutoff,
    deadlineUtc,
    deadlineParts: getColombiaDateParts(deadlineUtc),
  };
}

export async function GET(req: Request) {
  return handleDispatchReminders(req);
}

export async function POST(req: Request) {
  return handleDispatchReminders(req);
}

async function handleDispatchReminders(req: Request) {
  try {
    const url = new URL(req.url);
    const isTest = url.searchParams.get('test') === 'true';
    const previewOnly = url.searchParams.get('preview') === 'true';
    const customRecipient = url.searchParams.get('email');

    // 1. Fetch Global Settings from Sanity
    const settings = await client.fetch(`*[_type == "globalSettings"][0]{
      reminderEmail,
      enableDispatchReminders,
      dispatchCutoffHour
    }`);

    const reminderEmail = customRecipient || settings?.reminderEmail || 'tiendavirtual@telasreal.com';
    const isEnabled = settings?.enableDispatchReminders !== false;
    const cutoffHour = settings?.dispatchCutoffHour || 13;

    if (!isEnabled && !isTest && !previewOnly) {
      return NextResponse.json({
        success: true,
        message: 'Dispatch reminders are disabled in Global Settings.',
      });
    }

    // 2. Fetch pending / processing / paid orders that need dispatch
    const query = `*[_type == "order" && status in ["paid", "processing", "pending"] && !(status in ["shipped", "delivered", "cancelled"])] | order(date asc, _createdAt asc) {
      _id,
      orderNumber,
      date,
      _createdAt,
      status,
      paymentMethod,
      total,
      shippingAddress,
      items[]{
        name,
        quantity,
        price,
        unit
      }
    }`;

    const rawOrders = await client.fetch(query);
    const now = new Date();
    const nowParts = getColombiaDateParts(now);

    // Determine current notification label (10:00 AM or 3:00 PM or custom)
    let notificationTimeText = `${String(nowParts.hour).padStart(2, '0')}:${String(nowParts.minute).padStart(2, '0')} COT`;
    if (nowParts.hour <= 12) {
      notificationTimeText = '10:00 AM';
    } else {
      notificationTimeText = '3:00 PM';
    }

    const currentDateText = new Intl.DateTimeFormat('es-CO', {
      timeZone: 'America/Bogota',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(now);

    let urgentOrdersCount = 0;
    let nextDayOrdersCount = 0;

    // 3. Process each order & calculate remaining time
    const processedOrders: DispatchOrderItem[] = (rawOrders || []).map((order: any) => {
      const orderDateRaw = order.date || order._createdAt || new Date().toISOString();
      const orderDateUtc = new Date(orderDateRaw);
      const orderParts = getColombiaDateParts(orderDateUtc);

      const { isSameDayDispatch, deadlineUtc } = calculateOrderDispatchDeadline(orderDateUtc, cutoffHour);

      // Remaining time calculation
      const diffMs = deadlineUtc.getTime() - now.getTime();
      const isOverdue = diffMs < 0;
      const absDiff = Math.abs(diffMs);
      const remainingHours = Math.floor(absDiff / (1000 * 60 * 60));
      const remainingMinutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));

      let timeRemainingText = '';
      if (isOverdue) {
        timeRemainingText = `Vencido hace ${remainingHours}h ${remainingMinutes}m`;
      } else {
        timeRemainingText = `${remainingHours}h ${remainingMinutes}m restantes`;
      }

      // Format dates for display
      const orderDateFormatted = new Intl.DateTimeFormat('es-CO', {
        timeZone: 'America/Bogota',
        day: 'numeric',
        month: 'short',
      }).format(orderDateUtc);

      const orderTimeFormatted = `${String(orderParts.hour).padStart(2, '0')}:${String(orderParts.minute).padStart(2, '0')} COT`;

      const deadlineDateFormatted = new Intl.DateTimeFormat('es-CO', {
        timeZone: 'America/Bogota',
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: 'numeric',
      }).format(deadlineUtc);

      const isTodayOrder = orderParts.year === nowParts.year && orderParts.month === nowParts.month && orderParts.day === nowParts.day;
      let deadlineDescription = '';
      if (isSameDayDispatch) {
        deadlineDescription = isTodayOrder ? 'Mismo día (Hoy)' : 'Despacho Hoy (Atrasado)';
        urgentOrdersCount++;
      } else {
        deadlineDescription = 'Día siguiente';
        nextDayOrdersCount++;
      }

      // Customer info
      const customerName = order.shippingAddress?.fullName || order.shippingAddress?.firstName 
        ? `${order.shippingAddress?.firstName || ''} ${order.shippingAddress?.lastName || ''}`.trim()
        : 'Cliente Telas Real';

      return {
        id: order._id,
        orderNumber: order.orderNumber || order._id.slice(-6).toUpperCase(),
        customerName,
        customerPhone: order.shippingAddress?.phone || undefined,
        customerEmail: order.shippingAddress?.email || undefined,
        city: order.shippingAddress?.city || undefined,
        address: order.shippingAddress?.address || undefined,
        orderDateFormatted,
        orderTimeFormatted,
        deadlineDateFormatted,
        deadlineDescription,
        remainingHours,
        remainingMinutes,
        isOverdue,
        timeRemainingText,
        status: order.status || 'pending',
        total: Number(order.total || 0),
        items: (order.items || []).map((it: any) => ({
          name: it.name || it.title || 'Producto',
          quantity: it.quantity || 1,
          price: it.price || 0,
          unit: it.unit || 'm',
        })),
      };
    });

    const totalPendingOrders = processedOrders.length;

    // 4. If preview mode, return JSON without sending email
    if (previewOnly) {
      return NextResponse.json({
        success: true,
        preview: true,
        recipient: reminderEmail,
        notificationTimeText,
        currentDateText,
        totalPendingOrders,
        urgentOrdersCount,
        nextDayOrdersCount,
        orders: processedOrders,
      });
    }

    // 5. Send email notification via Resend
    const subjectPrefix = urgentOrdersCount > 0 ? `🚨 [URGENTE: ${urgentOrdersCount} HOY]` : '📦 [Control Despachos]';
    const emailSubject = `${subjectPrefix} Recordatorio ${notificationTimeText} — ${totalPendingOrders} pedidos pendientes`;

    const { data: emailData, error: resendError } = await resend.emails.send({
      from: 'Telas Real <tiendavirtual@telasreal.com>',
      to: reminderEmail,
      subject: emailSubject,
      react: DispatchReminderEmailTemplate({
        notificationTimeText,
        currentDateText,
        totalPendingOrders,
        urgentOrdersCount,
        nextDayOrdersCount,
        orders: processedOrders,
      }),
    });

    if (resendError) {
      console.error('Error sending dispatch reminder email via Resend:', resendError);
      return NextResponse.json({
        success: false,
        error: resendError,
        recipient: reminderEmail,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Dispatch reminder email sent successfully to ${reminderEmail}`,
      emailId: emailData?.id,
      recipient: reminderEmail,
      stats: {
        totalPending: totalPendingOrders,
        urgentToday: urgentOrdersCount,
        nextDay: nextDayOrdersCount,
      },
    });

  } catch (error: any) {
    console.error('Error in dispatch-reminders cron route:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
    }, { status: 500 });
  }
}
