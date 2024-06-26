import { Stack, PrimaryButton } from "@fluentui/react";
import { ErrorCircle24Regular } from "@fluentui/react-icons";

import styles from "./Answer.module.css";
import { useContext } from "react";
import { darkContext } from "../../pages/context/darkMode";

interface Props {
    error: string;
    onRetry: () => void;
}


export const AnswerError = ({ error, onRetry }: Props) => {
    const {isDark,setIsDark} = useContext(darkContext)

    return (
        <Stack className={`${isDark ? styles.answerContainer:styles.answerContainerDark }`} verticalAlign="space-between">
            <ErrorCircle24Regular aria-hidden="true" aria-label="Error icon" primaryFill="red" />

            <Stack.Item grow>
                <p className={styles.answerText}>{error}</p>
            </Stack.Item>

            {/* <PrimaryButton className={styles.retryButton} onClick={onRetry} text="Retry" /> */}
            <button className={styles.retryButton} onClick={onRetry}>Retry</button>
        </Stack>
    );
};
