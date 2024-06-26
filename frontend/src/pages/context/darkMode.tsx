import React, { createContext, useState, ReactNode } from "react";



// Define the type for context values
interface DarkContextProps {
  isDark: boolean;
  setIsDark: React.Dispatch<React.SetStateAction<boolean>>;
  seeCH: boolean;
  setSeeCH: React.Dispatch<React.SetStateAction<boolean>>;
  userLanguage: string;
  setLanguage: React.Dispatch<React.SetStateAction<string>>;
  starter: string;
  setStarter: React.Dispatch<React.SetStateAction<string>>;
}

// Create the context with initial values
const initialContext: DarkContextProps = {
  isDark: false,
  setIsDark: () => {},
  seeCH: false,
  setSeeCH: () => {},
  userLanguage: 'en',
  setLanguage: () => {},
  starter: '',
  setStarter: () => {}
};

// Create the context
export const darkContext = createContext(initialContext);

// Define props interface for the provider component
interface DarkThemeProviderProps {
  children: ReactNode;
}

// Create the provider component
export const DarkThemeProvider: React.FC<DarkThemeProviderProps> = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const [seeCH, setSeeCH] = useState(false);
  const [userLanguage, setLanguage] = useState('en'); // Default language is English
  const [starter,setStarter] = useState('');

  

  // Context value object
  const contextValue: DarkContextProps = {
    isDark,
    setIsDark,
    seeCH,
    setSeeCH,
    userLanguage,
    setLanguage,
    starter,
    setStarter
  };

  // Render provider with context value
  return (
    <darkContext.Provider value={contextValue}>
      {children}
    </darkContext.Provider>
  );
};
