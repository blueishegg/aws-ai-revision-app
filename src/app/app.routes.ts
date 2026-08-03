import { Route, Routes } from '@angular/router';

type LoadComponent = NonNullable<Route['loadComponent']>;

type NavigationItem = {
	path: string;
	label: string;
	icon: string;
	exact?: boolean;
};

type AppFeaturePage = {
	path: string;
	title: string;
	loadComponent: LoadComponent;
	navigation?: NavigationItem;
};

export const appFeaturePages: readonly AppFeaturePage[] = [
	{
		path: '',
		title: 'Dashboard | AWS AI Revision',
		loadComponent: () =>
			import('./features/dashboard/pages/dashboard/dashboard').then(
				(module) => module.Dashboard,
			),
		navigation: {
			path: '/',
			label: 'Dashboard',
			icon: 'dashboard',
			exact: true,
		},
	},
	{
		path: 'topics',
		title: 'Topics | AWS AI Revision',
		loadComponent: () =>
			import('./features/topics/pages/topics/topics').then(
				(module) => module.Topics,
			),
		navigation: {
			path: '/topics',
			label: 'Topics',
			icon: 'topic',
		},
	},
	{
		path: 'study',
		title: 'Study | AWS AI Revision',
		loadComponent: () =>
			import('./features/study/pages/study/study').then(
				(module) => module.Study,
			),
		navigation: {
			path: '/study',
			label: 'Study',
			icon: 'school',
		},
	},
	{
		path: 'quiz',
		title: 'Quiz | AWS AI Revision',
		loadComponent: () =>
			import('./features/quiz/pages/quiz/quiz').then(
				(module) => module.Quiz,
			),
		navigation: {
			path: '/quiz',
			label: 'Quiz',
			icon: 'quiz',
		},
	},
	{
		path: 'results',
		title: 'Results | AWS AI Revision',
		loadComponent: () =>
			import('./features/results/pages/results/results').then(
				(module) => module.Results,
			),
	},
	{
		path: 'progress',
		title: 'Progress | AWS AI Revision',
		loadComponent: () =>
			import('./features/progress/pages/progress/progress').then(
				(module) => module.Progress,
			),
		navigation: {
			path: '/progress',
			label: 'Progress',
			icon: 'trending_up',
		},
	},
];

export const primaryNavigationItems: readonly NavigationItem[] = appFeaturePages.flatMap(
	(page) => (page.navigation ? [page.navigation] : []),
);

export const routes: Routes = [
	{
		path: '',
		loadComponent: () =>
			import('./layout/app-shell/app-shell').then((module) => module.AppShell),
		children: appFeaturePages.map(({ navigation, ...route }) => ({
			...route,
			pathMatch: route.path === '' ? 'full' : undefined,
		})),
	},
	{
		path: '**',
		title: 'Page Not Found | AWS AI Revision',
		loadComponent: () =>
			import('./shared/components/not-found/not-found').then(
				(module) => module.NotFound,
			),
	},
];
