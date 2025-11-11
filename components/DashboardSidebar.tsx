"use client";

import {
	Dashboard as DashboardIcon,
	Person as PersonIcon,
	School as SchoolIcon,
} from "@mui/icons-material";
import {
	Box,
	Divider,
	Drawer,
	List,
	ListItem,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	Typography,
} from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";

const drawerWidth = 260;

const routes = [
	{
		path: "/dashboard",
		name: "Dashboard",
		icon: DashboardIcon,
	},
	{
		path: "/my-courses",
		name: "My Courses",
		icon: SchoolIcon,
	},
	{
		path: "/profile",
		name: "Profile",
		icon: PersonIcon,
	},
];

export default function DashboardSidebar() {
	const pathname = usePathname();

	const activeRoute = (path: string) => {
		return pathname === path;
	};

	return (
		<Drawer
			variant="permanent"
			sx={{
				width: drawerWidth,
				flexShrink: 0,
				"& .MuiDrawer-paper": {
					width: drawerWidth,
					boxSizing: "border-box",
					backgroundColor: "#9c27b0", // primary color
					color: "white",
				},
			}}
		>
			<Box sx={{ p: 2 }}>
				<Typography
					variant="h6"
					component="div"
					sx={{ color: "white", fontWeight: "bold" }}
				>
					Hemera Academy
				</Typography>
			</Box>
			<Divider sx={{ bgcolor: "rgba(255,255,255,0.2)" }} />
			<List>
				{routes.map((route) => (
					<ListItem key={route.path} disablePadding>
						<ListItemButton
							component={Link}
							href={route.path}
							sx={{
								"&:hover": {
									backgroundColor: "rgba(255,255,255,0.1)",
								},
								...(activeRoute(route.path) && {
									backgroundColor: "rgba(255,255,255,0.2)",
								}),
							}}
						>
							<ListItemIcon sx={{ color: "white" }}>
								<route.icon />
							</ListItemIcon>
							<ListItemText primary={route.name} />
						</ListItemButton>
					</ListItem>
				))}
			</List>
		</Drawer>
	);
}
