import { create } from 'zustand';

const getInitialTheme = () => {
    const saved = localStorage.getItem('smart_expense_theme');
    if (saved) return saved;
    return 'light'; // Default to light soft neumorphism
};

const useThemeStore = create((set) => ({
    theme: getInitialTheme(),
    toggleTheme: () => {
        set((state) => {
            const nextTheme = state.theme === 'light' ? 'dark' : 'light';
            localStorage.setItem('smart_expense_theme', nextTheme);
            if (nextTheme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
            return { theme: nextTheme };
        });
    },
    setTheme: (theme) => {
        localStorage.setItem('smart_expense_theme', theme);
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        set({ theme });
    },
}));

// Apply initial class on script execution
if (getInitialTheme() === 'dark') {
    document.documentElement.classList.add('dark');
} else {
    document.documentElement.classList.remove('dark');
}

export default useThemeStore;
