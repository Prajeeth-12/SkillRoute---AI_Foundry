import React from 'react';
import { Compass, User, LogOut, Moon, Sun } from 'lucide-react';
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
				'mx-auto w-full max-w-3xl rounded-full border shadow dark:shadow-none',
				'bg-background/95 dark:bg-zinc-900/95 supports-[backdrop-filter]:bg-background/80 dark:supports-[backdrop-filter]:bg-zinc-900/80 backdrop-blur-lg',
				'dark:border-zinc-800',
			)}
		>
			<nav className="mx-auto flex items-center justify-between p-1.5 px-4">
				<div 
					className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 duration-100"
					onClick={() => navigate('/dashboard')}
				>
					<Compass className="size-5" />
					<p className="font-mono text-base font-bold">SkillRoute</p>
				</div>
				
				<div className="flex items-center gap-2">
                    {userName && <span className="text-sm font-semibold text-gray-900 dark:text-white hidden sm:inline-block mr-2">{userName}</span>}
                    
					{/* Profile Circle Avatar */}
					<div 
						className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:opacity-90 transition-opacity"
						onClick={() => navigate('/profile')}
					>
						{userInitial}
					</div>

					<Button 
						variant="ghost" 
						size="icon" 
						className="rounded-full h-10 w-10"
						onClick={toggleTheme}
					>
						{theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
					</Button>
					<Button 
						variant="ghost" 
						size="icon" 
						className="rounded-full h-10 w-10 text-gray-500 hover:text-red-600"
						onClick={onLogout}
					>
						<LogOut className="h-5 w-5" />
					</Button>
				</div>
			</nav>
		</header>
	);
}
