import * as React from 'react';
import {
    Body,
    Container,
    Column,
    Head,
    Heading,
    Html,
    Img,
    Preview,
    Row,
    Section,
    Text,
    Tailwind,
    Hr
} from '@react-email/components';

interface GiftEmailProps {
    customerName: string;
    productName: string;
    quantity: number;
    orderId: string;
}

export const GiftEmail = ({
    customerName = "Cliente",
    productName = "Tela Premium",
    quantity = 1,
    orderId = "10001",
}: GiftEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>¡Felicidades! Tienes un obsequio en tu pedido #{orderId}</Preview>
            <Tailwind>
                <Body className="bg-gray-100 font-sans">
                    <Container className="bg-white mx-auto my-10 p-0 rounded-lg overflow-hidden shadow-lg border border-gray-200">
                        {/* Header Banner */}
                        <Section className="bg-indigo-600 px-10 py-8 text-center">
                            <Heading className="text-white m-0 font-bold text-3xl tracking-tight">
                                ¡Sorpresa de Liquidación! 🎉
                            </Heading>
                        </Section>

                        <Section className="px-10 py-8 text-center">
                            <Text className="text-gray-800 text-lg leading-relaxed mt-0">
                                Hola <strong>{customerName}</strong>,
                            </Text>
                            <Text className="text-gray-600 text-base leading-relaxed">
                                Queremos agradecerte por tu compra en nuestro evento especial. Al alcanzar el monto de la promoción en tu pedido <strong>#{orderId}</strong>, ¡has desbloqueado un beneficio exclusivo!
                            </Text>

                            <Section className="bg-indigo-50 border border-indigo-100 rounded-xl my-8 p-6">
                                <Heading as="h3" className="text-indigo-800 m-0 text-xl mb-4">
                                    Tu Regalo 🎁
                                </Heading>
                                <Row>
                                    <Column align="center">
                                        <Text className="text-gray-800 text-lg m-0 font-medium">
                                            {productName}
                                        </Text>
                                        <Text className="text-indigo-600 font-bold text-2xl m-0 mt-2">
                                            {quantity} Metro{quantity > 1 ? 's' : ''} Gratis
                                        </Text>
                                    </Column>
                                </Row>
                            </Section>

                            <Text className="text-gray-600 text-base leading-relaxed">
                                Este obsequio ha sido agregado automáticamente a tu pedido y lo enviaremos junto con el resto de tus telas.
                            </Text>
                            
                            <Hr className="border-gray-200 my-8" />
                            
                            <Text className="text-gray-500 text-sm">
                                Nota: Este beneficio aplica únicamente hasta agotar existencias. Este es un correo automático confirmando la adición del obsequio. 
                            </Text>
                        </Section>

                        {/* Footer */}
                        <Section className="bg-gray-50 px-10 py-6 text-center border-t border-gray-200">
                            <Text className="text-gray-500 text-sm m-0">
                                © {new Date().getFullYear()} Telas Real. Todos los derechos reservados.
                            </Text>
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default GiftEmail;
