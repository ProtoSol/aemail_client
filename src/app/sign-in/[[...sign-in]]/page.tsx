import { SignIn } from '@clerk/nextjs'
import React from 'react'

export default function Page() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <SignIn />
        </div>
    )
}
