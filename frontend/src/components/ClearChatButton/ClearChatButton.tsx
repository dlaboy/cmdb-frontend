import { Text } from "@fluentui/react";
import { Delete24Regular } from "@fluentui/react-icons";

import styles from "./ClearChatButton.module.css";
import { useContext, useEffect, useState } from "react";
import { darkContext } from "../../pages/context/darkMode";

interface Props {
    className?: string;
    onClick: () => void;
    disabled?: boolean;
}

// const userLanguage = 'en';
// let reiniciar_text = '';
// if (userLanguage.startsWith('pt')) {
//   reiniciar_text = 'Reiniciar conversa';
// } else if (userLanguage.startsWith('es')) {
//   reiniciar_text = 'Reiniciar conversación';
// } else {
//   reiniciar_text = 'Restart conversation';
// }

export const ClearChatButton = ({ className, disabled, onClick }: Props) => {
  const {isDark,setIsDark} = useContext(darkContext)
  const {userLanguage,setLanguage} = useContext(darkContext)
const [reiniciar_text,setReiniciarText] = useState("Restart conversation")


// const userLanguage = navigator.language;
useEffect(()=>{

  if (userLanguage.startsWith('pt')) {
    setReiniciarText('Reiniciar conversa')
  } else if (userLanguage.startsWith('es')) {
    setReiniciarText('Reiniciar conversación')

  } else {
    setReiniciarText('Restart conversation')

  }
},[userLanguage])
    
  return (
        <div className={`${styles.container} ${className ?? ""} ${disabled && styles.disabled}`} onClick={onClick}>
            <Delete24Regular style={{color: isDark ? '#292929' : '#fff'}}/>
            <Text style={{color: isDark ? '#292929' : '#fff'}}>{reiniciar_text}</Text>
        </div>
    );
};
