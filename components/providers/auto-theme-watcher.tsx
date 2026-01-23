"use client"

import * as React from "react"
import { useTheme } from "next-themes"

export function AutoThemeWatcher() {
    const { setTheme } = useTheme()

    React.useEffect(() => {
        // Check if user has explicitly saved a preference
        const storedTheme = localStorage.getItem("theme")

        // If no preference is stored, apply time-based logic
        if (!storedTheme) {
            const checkTimeAndSetTheme = () => {
                const now = new Date()
                const hours = now.getHours()

                // Define Day/Night cycle
                // Dark Mode: 19:00 (7 PM) to 07:00 (7 AM)
                const isNight = hours >= 19 || hours < 7

                setTheme(isNight ? "dark" : "light")
            }

            checkTimeAndSetTheme()

            // Optional: Check periodically (e.g., every minute) if the browser stays open
            const interval = setInterval(checkTimeAndSetTheme, 60 * 1000)

            return () => clearInterval(interval)
        }
    }, [setTheme])

    return null
}
