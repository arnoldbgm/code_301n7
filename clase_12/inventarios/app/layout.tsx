import { Toast } from '@heroui/react'

import './globals.css'

export default function RootLayout({children}: {children: React.ReactNode}) {
    return (
        <html lang="en">
            <body>
                <main>
                    {children}
                </main>
                <Toast.Provider placement="top end" />
            </body>
        </html>
    );
}