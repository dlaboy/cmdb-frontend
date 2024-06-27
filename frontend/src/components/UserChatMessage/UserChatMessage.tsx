import { useContext } from "react";
import styles from "./UserChatMessage.module.css";
import { darkContext } from "../../pages/context/darkMode";

interface Props {
    message: string;
}

export const UserChatMessage = ({ message }: Props) => {
     const {isDark,setIsDark} = useContext(darkContext)
    const {file,setFile} = useContext(darkContext)


     function extractQuestion(text:string) {
        const questionStart = text.indexOf("Question:") + "Question: ".length;
        const questionEnd = text.indexOf("File Content:");
        
        if (questionStart < questionEnd && questionStart > -1 && questionEnd > -1) {
          return text.substring(questionStart, questionEnd).trim();
        }
      
        return null; // Return null if the pattern isn't found
      }
      function extractFileContent(text:string) {
        const contentStart = text.indexOf("File Content:");
        if (contentStart !== -1) {
          return text.substring(contentStart + "File Content:".length).trim();
        }
        return null; // Return null if 'File Content:' is not found
      }
      const question = extractQuestion(message)
      const fileContent = extractFileContent(message)
   

      let fileName = '';
      if (file){
        fileName = file.name
      }
    return (
        <div className={styles.container}>
            <div className={`${isDark ? styles.message:styles.messageDark } `}>
                <div className="">
                    {question}
                </div>
                <div className={styles.fileUploaded}>
                    {fileName}
                </div>


            </div>

        </div>
    );
};
