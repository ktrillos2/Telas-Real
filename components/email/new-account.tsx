import * as React from 'react';
import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Img,
    Link,
    Preview,
    Section,
    Text,
    Tailwind,
} from '@react-email/components';

interface NewAccountEmailProps {
    customerName: string;
    email: string;
    temporaryPassword?: string;
    loginUrl: string;
}

export const NewAccountEmail = ({
    customerName,
    email,
    temporaryPassword,
    loginUrl,
}: NewAccountEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>Bienvenido a Telas Real - Tus credenciales de acceso</Preview>
            <Tailwind>
                <Body className="bg-gray-100 font-sans">
                    <Container className="mx-auto my-[40px] max-w-[600px] rounded p-[20px] bg-white">
                        <Section className="mt-[24px]">
                            <Img
                                src="https://telasreal.com/logo-telas-real.png"
                                width="150"
                                height="50"
                                alt="Telas Real"
                                className="mx-auto"
                            />
                        </Section>
                        <Heading className="text-center text-[24px] font-normal text-gray-800 my-[30px] p-0 mx-0">
                            ¡Bienvenido a Telas Real!
                        </Heading>
                        <Text className="text-[14px] leading-[24px] text-gray-600">
                            Hola <strong>{customerName}</strong>,
                        </Text>
                        <Text className="text-[14px] leading-[24px] text-gray-600">
                            Gracias por realizar tu compra. Hemos creado una cuenta para ti para que puedas realizar el seguimiento de tus pedidos y agilizar tus futuras compras.
                        </Text>
                        <Section className="bg-gray-50 p-4 rounded-lg my-6 border border-gray-200">
                            <Text className="text-[16px] font-semibold text-center text-gray-800 m-0 mb-2">
                                Tus credenciales de acceso:
                            </Text>
                            <Text className="text-[14px] text-gray-600 m-0">
                                <strong>Usuario:</strong> {email}
                            </Text>
                            {temporaryPassword && (
                                <Text className="text-[14px] text-gray-600 m-0 mt-1">
                                    <strong>Contraseña temporal:</strong> {temporaryPassword}
                                </Text>
                            )}
                        </Section>
                        <Text className="text-[14px] leading-[24px] text-gray-600 text-center">
                            Por seguridad, se te pedirá que cambies esta contraseña al iniciar sesión por primera vez.
                        </Text>
                        <Section className="text-center mt-[32px] mb-[32px]">
                            <Link
                                href={loginUrl}
                                className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                            >
                                INICIAR SESIÓN / VER MI PEDIDO
                            </Link>
                        </Section>
                        <Text className="text-[12px] text-gray-500 mt-[30px] text-center">
                            Si tienes alguna pregunta, no dudes en contactarnos respondiendo a este correo o a través de WhatsApp.
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default NewAccountEmail;
