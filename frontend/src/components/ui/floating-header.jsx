import React from 'react';
import { Compass, User, LogOut, Moon, Sun, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from './button';
import { cn } from '../../lib/utils';
import { getAuth } from 'firebase/auth';

export function FloatingHeader({ onLogout, userName }) {
	const navigate = useNavigate();
	const { theme, toggleTheme } = useTheme();
	const auth = getAuth();
	const userInitial = userName?.charAt(0)?.toUpperCase() || auth.currentUser?.email?.charAt(0)?.toUpperCase() || 'U';

	return (
		<header
			className={cn(
				'sticky top-5 z-50',
				'mx-auto w-[92%] sm:w-full max-w-2xl rounded-full border shadow dark:shadow-none',
				'bg-background/95 dark:bg-zinc-900/95 supports-[backdrop-filter]:bg-background/80 dark:supports-[backdrop-filter]:bg-zinc-900/80 backdrop-blur-lg',
				'dark:border-zinc-800',
			)}
		>
			<nav className="mx-auto flex items-center justify-between p-1 px-3">
				<div
					className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 duration-100"
					onClick={() => navigate('/dashboard')}
				>
					<Compass className="size-4 text-gray-900 dark:text-white" />
					<p className="font-mono text-sm font-bold text-gray-900 dark:text-white">SkillRoute</p>
				</div>

				<div className="flex items-center gap-2">
					<button
						onClick={() => navigate('/skill-gap')}
						className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors"
					>
						<Zap className="w-3 h-3" />
						Skill Gap
					</button>
					{userName && <span className="text-xs font-semibold text-gray-900 dark:text-white hidden sm:inline-block mr-2">{userName}</span>}

					{/* Profile Circle Avatar */}
					<div
						className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs cursor-pointer hover:opacity-90 transition-opacity"
						onClick={() => navigate('/profile')}
					>
						{userInitial}
					</div>

					<Button
						variant="ghost"
						size="icon"
						className="rounded-full h-8 w-8 text-gray-700 dark:text-white"
						onClick={toggleTheme}
					>
						{theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className="rounded-full h-8 w-8 text-gray-500 hover:text-red-600"
						onClick={onLogout}
					>
						<LogOut className="h-4 w-4" />
					</Button>
				</div>
			</nav>
		</header>
	);
}
