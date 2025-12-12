import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function PoliciesPage() {
    return (
        <div className="min-h-screen flex flex-col">
            <main className="flex-1">
                <div className="container mx-auto px-4 py-12 md:py-16">
                    <h1 className="text-3xl font-light mb-8 text-center">Nuestras Políticas</h1>

                    <div className="max-w-4xl mx-auto space-y-12">
                        {/* Política de Envíos */}
                        <section className="space-y-6">
                            <h2 className="text-2xl font-normal border-b border-border pb-2">Política de envíos</h2>

                            <div className="space-y-4 text-muted-foreground font-light text-sm md:text-base">
                                <div>
                                    <h3 className="text-foreground font-medium mb-1">Modalidad de Pago del Envío</h3>
                                    <p>Todos los costos de envíos realizados por Telas Real deberán ser pagados directamente a la transportadora seleccionada por el cliente.</p>
                                    <ul className="list-disc pl-5 mt-2 space-y-1">
                                        <li>El pago se efectuará contra entrega, según las condiciones establecidas por la transportadora.</li>
                                        <li>El costo del envío variará dependiendo del peso y dimensiones del pedido, así como de la ubicación de entrega.</li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="text-foreground font-medium mb-1">Variaciones en el Peso y el Costo del Envío</h3>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>El precio total del envío puede variar dependiendo de la ciudad seleccionada y de las características específicas del producto, incluyendo su empaque.</li>
                                        <li>Telas Real trabajará para proporcionar una estimación precisa, pero las tarifas finales serán determinadas por la transportadora según sus políticas.</li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="text-foreground font-medium mb-1">Rastreo de Pedidos</h3>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>Una vez que el pedido sea despachado, Telas Real enviará al cliente el documento de envío proporcionado por la transportadora.</li>
                                        <li>Este documento incluirá el número de guía, que permitirá al cliente rastrear el estado del envío directamente a través de la plataforma de la transportadora.</li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="text-foreground font-medium mb-1">Responsabilidad de Entrega</h3>
                                    <p>Telas Real no asume responsabilidad alguna en casos donde el cliente no reciba el pedido debido a:</p>
                                    <ul className="list-disc pl-5 mt-2 space-y-1">
                                        <li>Ausencia del cliente en el lugar de entrega.</li>
                                        <li>Datos incorrectos o incompletos proporcionados por el cliente.</li>
                                        <li>Rechazo del pedido en el momento de la entrega.</li>
                                    </ul>
                                    <p className="mt-2">En cualquiera de estas situaciones, el cliente será responsable de cubrir todos los cargos generados, incluyendo:</p>
                                    <ul className="list-disc pl-5 mt-2 space-y-1">
                                        <li>Costos adicionales por reprogramación o devolución del envío.</li>
                                        <li>Gastos asociados a la nueva entrega.</li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="text-foreground font-medium mb-1">Sugerencias para Evitar Inconvenientes</h3>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>Verifique cuidadosamente los datos de envío antes de confirmar su pedido.</li>
                                        <li>Asegúrese de que alguien esté disponible para recibir el pedido en el horario estimado de entrega proporcionado por la transportadora.</li>
                                        <li>Consulte previamente las políticas de la transportadora para conocer sus términos y condiciones específicas.</li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="text-foreground font-medium mb-1">Envíos Nacionales</h3>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>Todos los envíos dentro del territorio nacional estarán sujetos a las tarifas y condiciones de la transportadora seleccionada.</li>
                                        <li>La empresa garantizará el despacho del pedido dentro del tiempo establecido, pero no se hace responsable por retrasos atribuibles a la transportadora.</li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="text-foreground font-medium mb-1">Aceptación de la Política</h3>
                                    <p>Al confirmar su pedido con Telas Real, usted acepta y comprende las condiciones descritas en esta política.</p>
                                </div>

                                <div>
                                    <h3 className="text-foreground font-medium mb-1">Contacto para Asistencia</h3>
                                    <p>En caso de dudas o inconvenientes, puede comunicarse con nuestro servicio al cliente al correo: <a href="mailto:tiendavirtual@telasreal.com" className="text-primary hover:underline">tiendavirtual@telasreal.com</a> o al número: <a href="tel:+573115415001" className="text-primary hover:underline">+57 311 5415001</a>.</p>
                                </div>
                            </div>
                        </section>

                        {/* Política de Inventarios */}
                        <section className="space-y-6">
                            <h2 className="text-2xl font-normal border-b border-border pb-2">Política de Inventarios</h2>

                            <div className="space-y-4 text-muted-foreground font-light text-sm md:text-base">
                                <div>
                                    <h3 className="text-foreground font-medium mb-1">Inventario en el Sitio Web</h3>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>Telas Real pone a disposición de sus clientes un inventario estándar de 100 metros por producto en su plataforma en línea.</li>
                                        <li>Este inventario refleja la cantidad disponible para compras inmediatas y puede variar según la demanda.</li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="text-foreground font-medium mb-1">Solicitudes de mayor cantidad</h3>
                                    <p>Si el cliente requiere más de 100 metros de un producto específico, por favor ponerse en contacto con nuestro equipo para verificar la disponibilidad y gestionar su pedido.</p>
                                    <p className="mt-2">Para mayor información, comuníquese al número: <a href="tel:+573159021516" className="text-primary hover:underline">+57 3159021516</a> o envíe un correo electrónico a: <a href="mailto:tiendavirtual@telasreal.com" className="text-primary hover:underline">tiendavirtual@telasreal.com</a>.</p>
                                </div>

                                <div>
                                    <h3 className="text-foreground font-medium mb-1">Actualización de Inventarios</h3>
                                    <p>El inventario en el sitio web se actualiza regularmente, pero puede haber diferencias debido a compras simultáneas o reservas en proceso.</p>
                                    <p className="mt-2">Recomendamos confirmar la disponibilidad directamente con nuestro equipo si se requiere un volumen mayor al establecido.</p>
                                    <p className="mt-4 italic">Con esta política buscamos garantizar la mejor experiencia de compra para nuestros clientes, brindando claridad sobre las cantidades disponibles y opciones para pedidos especiales.</p>
                                </div>
                            </div>
                        </section>

                        {/* Política de cambios y devoluciones */}
                        <section className="space-y-6">
                            <h2 className="text-2xl font-normal border-b border-border pb-2">Política de cambios y devoluciones</h2>

                            <div className="space-y-4 text-muted-foreground font-light text-sm md:text-base">
                                <div>
                                    <h3 className="text-foreground font-medium mb-1">1. Plazo para solicitar un cambio</h3>
                                    <p>Tienes un plazo de 5 días calendario desde la fecha de recepción de tu pedido para solicitar un cambio. Una vez pasado este plazo, no podremos garantizar la disponibilidad de las telas ni realizar el proceso correspondiente.</p>
                                </div>

                                <div>
                                    <h3 className="text-foreground font-medium mb-1">2. Condiciones para aceptar un cambio</h3>
                                    <p>Para que un cambio sea aceptado, el producto debe cumplir con las siguientes condiciones:</p>
                                    <ul className="list-disc pl-5 mt-2 space-y-1">
                                        <li>Estar en perfecto estado, sin uso.</li>
                                        <li>No presentar cortes, manchas, alteraciones o manipulaciones.</li>
                                    </ul>
                                    <p className="mt-2 text-foreground/80 font-medium">No aceptamos cambios de telas que:</p>
                                    <ul className="list-disc pl-5 mt-1 space-y-1">
                                        <li>Hayan sido sublimadas fuera de Telas Real.</li>
                                        <li>Estén cortadas o manipuladas.</li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="text-foreground font-medium mb-1">3. Productos sin cambio</h3>
                                    <p>No se aceptan cambios en los siguientes casos:</p>
                                    <ul className="list-disc pl-5 mt-2 space-y-1">
                                        <li>Telas adquiridas en promociones o con descuentos.</li>
                                        <li>Telas personalizadas mediante sublimación.</li>
                                        <li>Telas con medidas especiales (cortes a pedido).</li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="text-foreground font-medium mb-1">4. Opciones de cambio</h3>
                                    <p>Puedes realizar el cambio por:</p>
                                    <ul className="list-disc pl-5 mt-2 space-y-1">
                                        <li>Otra tela del mismo valor.</li>
                                        <li>Una tela de mayor valor, pagando la diferencia correspondiente.</li>
                                    </ul>
                                    <p className="mt-2 font-medium text-foreground">No realizamos devoluciones de dinero. Si no deseas realizar el cambio de inmediato, puedes solicitar que el valor del producto quede como saldo a favor para una próxima compra.</p>
                                </div>

                                <div>
                                    <h3 className="text-foreground font-medium mb-1">5. ¿Cómo solicitar un cambio?</h3>
                                    <p>Contáctanos a través de:</p>
                                    <ul className="list-none mt-2 space-y-1">
                                        <li>WhatsApp: <a href="https://wa.me/573115415001" className="text-primary hover:underline">+57 311 5415001</a></li>
                                        <li>Correo electrónico: <a href="mailto:tiendavirtual@telasreal.com" className="text-primary hover:underline">tiendavirtual@telasreal.com</a></li>
                                    </ul>
                                    <p className="mt-2">Por favor incluye:</p>
                                    <ul className="list-disc pl-5 mt-1 space-y-1">
                                        <li>Número de pedido (lo encontrarás en tu factura).</li>
                                        <li>Motivo del cambio.</li>
                                        <li>Fotos del producto recibido (si aplica).</li>
                                    </ul>
                                    <p className="mt-2">Nuestro equipo responderá en un plazo máximo de 2 días hábiles con las instrucciones para gestionar el cambio.</p>
                                </div>

                                <div>
                                    <h3 className="text-foreground font-medium mb-1">6. Costos de envío</h3>
                                    <p>El cliente deberá asumir los costos de envío del producto a cambiar, excepto en los casos donde el error haya sido responsabilidad de Telas Real (producto o medida equivocada). En tales casos, nosotros cubriremos los costos de recolección y envío del nuevo producto.</p>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    )
}
