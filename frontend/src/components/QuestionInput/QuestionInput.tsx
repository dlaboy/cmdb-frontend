import { ChangeEvent, useContext, useEffect, useRef, useState } from "react";
import { Stack, TextField } from "@fluentui/react";
import { getTokenOrRefresh } from './token_util';
import { Send28Filled, BookOpenMicrophone28Filled, SlideMicrophone32Filled, TriangleRegular } from "@fluentui/react-icons";
import { ResultReason, SpeechConfig, AudioConfig, SpeechRecognizer } from 'microsoft-cognitiveservices-speech-sdk';

import styles from "./QuestionInput.module.css";
import { darkContext } from "../../pages/context/darkMode";
interface Props {
    onSend: (question: string) => void;
    disabled: boolean;
    placeholder?: string;
    clearOnSend?: boolean;
    // conversationStarter:string
}

export const QuestionInput = ({ onSend, disabled, placeholder, clearOnSend}: Props) => {
    
    
    const [question, setQuestion] = useState<string>("");
    
    
    const {isDark, setIsDark} = useContext(darkContext)
    const {starter, setStarter} = useContext(darkContext)
    const [triggerStarter,setTrigger] = useState(0)
    
    useEffect(()=>{
        if(starter !== ""){
            setQuestion(starter)
            setTrigger(prev => prev + 1)
        }  
    },[starter])

    useEffect(()=>{
        onSend(question)
        if (clearOnSend) {
            setQuestion("");
        }
    },[triggerStarter])
    
    const [file, setFile] = useState<File | null>(null);
    const [fileContent, setFileContent] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);


    useEffect(()=>{
        console.log("File: ",file)
    }
    ,[file])
    


    const sendQuestion = () => {
        if (disabled || !question.trim()) {
            return;
        }

        if (fileContent == '') {
            onSend(question);
        }
        else{
            let combinedQuestion = `Question: ${question}\nFile Content:\n${fileContent}`;
            onSend(combinedQuestion)
        }

        if (clearOnSend) {
            setQuestion("");
        }
    };

    const sttFromMic = async () => {
        const tokenObj = await getTokenOrRefresh();
        const speechConfig = SpeechConfig.fromAuthorizationToken(tokenObj.authToken, tokenObj.region);
        speechConfig.speechRecognitionLanguage = tokenObj.speechRecognitionLanguage;
        
        const audioConfig = AudioConfig.fromDefaultMicrophoneInput();
        const recognizer = new SpeechRecognizer(speechConfig, audioConfig);

        // const userLanguage = navigator.language;
        const userLanguage = 'es';
        
        let reiniciar_text = '';
        if (userLanguage.startsWith('pt')) {
          reiniciar_text = 'Pode falar usando seu microfone...';
        } else if (userLanguage.startsWith('es')) {
          reiniciar_text = 'Puedes hablar usando su micrófono...';
        } else {
          reiniciar_text = 'You can talk using your microphone...';
        }

        setQuestion(reiniciar_text);

        recognizer.recognizeOnceAsync(result => {
            let displayText;
            if (result.reason === ResultReason.RecognizedSpeech) {
                displayText = result.text;
                //setQuestion(displayText);
                //onSend(question);
            } else {
                displayText = 'ERROR: Voice recognition was canceled or the voice cannot be recognized. Make sure your microphone is working properly.';
                //setQuestion(displayText);
            }
            setQuestion(displayText);
        });
    };

    const onEnterPress = (ev: React.KeyboardEvent<Element>) => {
        if (ev.key === "Enter" && !ev.shiftKey) {
            ev.preventDefault();
            sendQuestion();
        }
    };

    const onQuestionChange = (_ev: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
        if (!newValue) {
            setQuestion("");
        } else if (newValue.length <= 1000) {
            setQuestion(newValue);
        }
     

    };

    const sendQuestionDisabled = disabled || !question.trim();

    const [attachmentOptions,setAttachmentOptions] = useState(false)
    
    const handleAttach = () =>{
        setAttachmentOptions(prev => !prev)
    }


  
    // Handle file selection
    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files != null){
            setFile(event.target.files[0]); // Set the selected file
            if (event.target.files[0]) {
              const reader = new FileReader();
              reader.onload = (e:ProgressEvent<FileReader> ) => {
                  if (typeof e.target?.result === 'string'){
                      setFileContent(e.target.result); // Reading the file content
                  }
              };
              
              reader.readAsText(event.target.files[0]); // Assumes the file is a text file
            }
        }
    };
  
    // Handle button click to trigger file input
    const handleButtonClick = () => {
        if (fileInputRef.current){
            fileInputRef.current.click();
        }
    };
    const handleDeleteFile = () =>{
        setFile(null)
    };

    return (
        <Stack horizontal className={`${isDark ? styles.questionInputContainer:styles.questionInputContainerDark }`}>
            
            <div className={`${attachmentOptions ? styles.upload:styles.uploadHide}`}>
            <div>
      <input
        type="file"
        style={{ display: 'none' }}
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=" .txt" // Only accept PDF and DOCX files
      />
      <button onClick={handleButtonClick} className={styles.uploadFileText}>
        Upload a File
      </button>
      <div className={`${file ?styles.fileSelected:styles.fileSelectedHide }`}>
        {file && <div className={styles.fileName}>

            {file.name}
            <button className={styles.deleteFile} onClick={handleDeleteFile}>x</button>
            </div>}
            {/* {fileContent && <div><strong>Content:</strong><pre>{fileContent}</pre></div>} */}
        
      </div>
    </div>
            </div>
            <img className={styles.paperclip} src="/paperclip.png" alt="" onClick={handleAttach}/>
            <TextField
                     style={{
                        backgroundColor: isDark ? '#fff' : '#292929',
                        color: isDark ? '#292929' : '#fff',
                      }}
                      className={styles.questionInputTextArea}
                placeholder={placeholder}
                multiline
                resizable={false}
                borderless
                value={question}
                onChange={onQuestionChange}
                onKeyDown={onEnterPress}
            />
            <div className={styles.questionInputButtonsContainer}>
                <div
                    className={`${styles.questionInputSendButton} ${sendQuestionDisabled ? styles.questionInputSendButtonDisabled : ""}`}
                    aria-label="Boton hacer preguntas"
                    onClick={sendQuestion}
                >
                    {/* <Send28Filled primaryFill="rgba(115, 118, 225, 1)" /> */}
                    <Send28Filled primaryFill="rgba(105, 105, 105, 1)" />
                </div>
                <div
                    className={`${styles.questionInputSendButton}}`}
                    aria-label="Boton hablar"
                    onClick={sttFromMic}
                >
                    {/* <SlideMicrophone32Filled primaryFill="rgba(115, 118, 225, 1)" /> */}
                    <SlideMicrophone32Filled primaryFill="rgba(105, 105, 105, 1)" />
                </div>
            </div>
        </Stack>
    );
};
