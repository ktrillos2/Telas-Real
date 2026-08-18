import { NextResponse } from 'next/server';
import { client } from '@/sanity/lib/client';
import resend from '@/lib/resend';
import { DispatchReminderEmailTemplate, type DispatchOrderItem } from '@/components/emails/dispatch-reminder-template';
import {
  getColombiaDateParts,
  getColombianHoliday,
  isWeekendInColombia,
  isColombianBusinessDay,
  getNextColombianBusinessDay,
} from '@/lib/colombia-holidays';

export const dynamic = 'force-dynamic';

// Calculate deadline for an order according to the rule:
// - If placed on a business day BEFORE cutoff (1:00 PM / 13:00 COT): Dispatched SAME DAY (Deadline: Today 17:00 COT)
// - If placed on a business day AFTER cutoff (>= 13:00 COT) OR on a weekend / holiday:
//   Dispatched NEXT BUSINESS DAY (Deadline: Next business day 17:00 COT, skipping weekends and holidays)
function calculateOrderDispatchDeadline(orderDateUtc: Date, cutoffHour: number = 13) {
  const parts = getColombiaDateParts(orderDateUtc);
  const isOrderOnBusinessDay = isColombianBusinessDay(orderDateUtc);
  const isBeforeCutoff = isOrderOnBusinessDay && parts.hour < cutoffHour;

  let targetBusinessDayDate: Date;

  if (isBeforeCutoff) {
    // Same day dispatch
    targetBusinessDayDate = new Date(
      `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}T17:00:00-05:00`
    );
  } else {
    // Next business day dispatch
    const nextDayObj = getNextColombianBusinessDay(orderDateUtc);
    const nextParts = getColombiaDateParts(nextDayObj);
    targetBusinessDayDate = new Date(
      `${nextParts.year}-${String(nextParts.month).padStart(2, '0')}-${String(nextParts.day).padStart(2, '0')}T17:00:00-05:00`
    );
  }

  const deadlineParts = getColombiaDateParts(targetBusinessDayDate);

  return {
    isSameDayDispatch: isBeforeCutoff,
    deadlineUtc: targetBusinessDayDate,
    deadlineParts,
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

    const now = new Date();
    const nowParts = getColombiaDateParts(now);

    const currentDateText = new Intl.DateTimeFormat('es-CO', {
      timeZone: 'America/Bogota',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(now);

    // 1. Validar si hoy es fin de semana (Sábado/Domingo) o día festivo en Colombia
    const isWeekend = isWeekendInColombia(now);
    const holidayInfo = getColombianHoliday(now);
    const isBusinessDay = isColombianBusinessDay(now);

    if (!isBusinessDay && !isTest && !previewOnly) {
      const reason = isWeekend
        ? 'Fin de semana: Los recordatorios automáticos de despacho solo se envían de lunes a viernes.'
        : `Día festivo en Colombia (${holidayInfo.holidayName}): No se despacha ni se envían recordatorios automáticos en días festivos.`;

      return NextResponse.json({
        success: true,
        skipped: true,
        reason,
        colombiaDate: currentDateText,
        isWeekend,
        isHoliday: holidayInfo.isHoliday,
        holidayName: holidayInfo.holidayName || null,
      });
    }

    // 2. Fetch Global Settings from Sanity
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

    // 3. Fetch pending / processing / paid orders that need dispatch
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

    // Determine current notification label (10:00 AM or 3:00 PM or custom)
    let notificationTimeText = `${String(nowParts.hour).padStart(2, '0')}:${String(nowParts.minute).padStart(2, '0')} COT`;
    if (nowParts.hour <= 12) {
      notificationTimeText = '10:00 AM';
    } else {
      notificationTimeText = '3:00 PM';
    }

    let urgentOrdersCount = 0;
    let nextDayOrdersCount = 0;

    // 4. Process each order & calculate remaining time
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
        deadlineDescription = 'Día siguiente hábil';
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

    // 5. If preview mode, return JSON without sending email
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
        isBusinessDay,
        holidayName: holidayInfo.holidayName || null,
        orders: processedOrders,
      });
    }

    // 6. Send email notification via Resend
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
      }) as React.ReactElement,
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
