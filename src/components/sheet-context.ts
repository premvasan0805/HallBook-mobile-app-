import { createContext, useContext } from 'react';

/**
 * True inside a popup (bottom sheet or dialog). Shared inputs and buttons read it to switch
 * from the page style to the blue glass popup style without every caller passing a prop.
 */
export const InPopupContext = createContext(false);

export const useInPopup = () => useContext(InPopupContext);
