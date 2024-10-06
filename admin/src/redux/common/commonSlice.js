import { createSlice } from "@reduxjs/toolkit";

const commonSlice = createSlice({
	name: "common",
	initialState: {
		isLoading: false, // Loading spinner state
		message: {
			type: "", // 'success', 'error', 'info', etc.
			content: "", // Message content
			show: false, // Whether to show the message
		},
	},
	reducers: {
		// Loading spinner actions
		startLoading: (state) => {
			state.isLoading = true;
		},
		stopLoading: (state) => {
			state.isLoading = false;
		},

		// Message actions
		showMessage: (state, action) => {
			state.message.type = action.payload.type;
			state.message.content = action.payload.content;
			state.message.show = true;
		},
		hideMessage: (state) => {
			state.message.show = false;
		},
	},
});

export const { startLoading, stopLoading, showMessage, hideMessage } =
	commonSlice.actions;
export default commonSlice.reducer;
