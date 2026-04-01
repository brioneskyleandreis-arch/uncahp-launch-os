/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['"Space Grotesk"', 'sans-serif'],
            },
            colors: {
                primary: 'var(--primary)',
                'bg-app': 'var(--bg-app)',
                'bg-surface': 'var(--bg-surface)',
                'bg-surface-hover': 'var(--bg-surface-hover)',
                'bg-card': 'var(--bg-card)',
                'text-main': 'var(--text-main)',
                'text-muted': 'var(--text-muted)',
                'text-dim': 'var(--text-dim)',
                'border-color': 'var(--border)', /* Replaced border -> border-color to avoid conflicts with Tailwind's border width */
                'divider': 'var(--divider)',
                success: 'var(--success)',
                warning: 'var(--warning)',
                error: 'var(--error)',
                info: 'var(--info)',
            }
        },
    },
    plugins: [],
}
