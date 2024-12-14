"use client";

import { ExtendedUser, setUser } from "@/lib/features/auth/authSlice";
import { store } from "@/lib/store";
import { useSession } from "next-auth/react";
import React, { useEffect } from "react";
import { Provider, useDispatch } from "react-redux";

function ReduxSessionSync(): null {
	const { data: session } = useSession();
	const dispatch = useDispatch();

	useEffect(() => {
		if (session?.user) {
			dispatch(setUser(session.user as ExtendedUser));
		} else {
			dispatch(setUser(null));
		}
	}, [session, dispatch]);

	return null;
}

interface ReduxProviderProps {
	children: React.ReactNode;
}

export function ReduxProvider({ children }: ReduxProviderProps) {
	return (
		<Provider store={store}>
			<ReduxSessionSync />
			{children}
		</Provider>
	);
}
