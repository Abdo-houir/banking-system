
import dayjs from 'dayjs';
import "dayjs/locale/ar";
import "dayjs/locale/en";
import customParseFormat from 'dayjs/plugin/customParseFormat';
import localFont from "next/font/local";
import { ReactNode } from 'react';
import "../../../src/app/globals.css";
import AppMantineProvider from './mantine/AppMantineProvider';

type Props = {
    children: ReactNode,
}

dayjs.extend(customParseFormat);



const englishFont = localFont({
    src: "../../../public/fonts/Ar-ScheherazadeNew-Regular.ttf",
    variable: "--font-english",
});



const AppProvider = ({ children }: Props) => {


    const font = englishFont.className;
    return (
        <html >
            <body className={font}>
                <AppMantineProvider>
                    {children}
                </AppMantineProvider>
            </body>
        </html>

    )
}

export default AppProvider