import { useRef, useState, useEffect, useContext } from "react";
import { Checkbox, Panel, DefaultButton, TextField, SpinButton } from "@fluentui/react";
import { SparkleFilled, TabDesktopMultipleBottomRegular } from "@fluentui/react-icons";

import styles from "./Chat.module.css";

import { chatApiGpt, Approaches, AskResponse, ChatRequest, ChatRequestGpt, ChatTurn } from "../../api";
import { Answer, AnswerError, AnswerLoading } from "../../components/Answer";
import { QuestionInput } from "../../components/QuestionInput";
import { ExampleList } from "../../components/Example";
import { UserChatMessage } from "../../components/UserChatMessage";
import { AnalysisPanel, AnalysisPanelTabs } from "../../components/AnalysisPanel";
import { ClearChatButton } from "../../components/ClearChatButton";
import { ConversationHistoryButton } from "../../components/ConversationHistoryButton";
import { getTokenOrRefresh } from "../../components/QuestionInput/token_util";
import { SpeechConfig, AudioConfig, SpeechSynthesizer, ResultReason } from "microsoft-cognitiveservices-speech-sdk";
import { getFileType } from "../../utils/functions";
import { darkContext } from "../context/darkMode";




const Chat = () => {

    const {isDark,setIsDark} = useContext(darkContext)
    const {userLanguage,setLanguage} = useContext(darkContext)


    // speech synthesis is disabled by default
    const speechSynthesisEnabled = false;

    const [placeholderText, setPlaceholderText] = useState("");
    const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);
    const [promptTemplate, setPromptTemplate] = useState<string>("");
    const [retrieveCount, setRetrieveCount] = useState<number>(3);
    const [useSemanticRanker, setUseSemanticRanker] = useState<boolean>(true);
    const [useSemanticCaptions, setUseSemanticCaptions] = useState<boolean>(false);
    const [excludeCategory, setExcludeCategory] = useState<string>("");
    const [useSuggestFollowupQuestions, setUseSuggestFollowupQuestions] = useState<boolean>(false);

    const lastQuestionRef = useRef<string>("");
    const chatMessageStreamEnd = useRef<HTMLDivElement | null>(null);
    const [fileType, setFileType] = useState<string>("");

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<unknown>();

    const [activeCitation, setActiveCitation] = useState<string>();
    const [activeAnalysisPanelTab, setActiveAnalysisPanelTab] = useState<AnalysisPanelTabs | undefined>(undefined);

    const [selectedAnswer, setSelectedAnswer] = useState<number>(0);
    const [answers, setAnswers] = useState<[user: string, response: AskResponse][]>([]);

    const [userId, setUserId] = useState<string>("");
    const triggered = useRef(false);

    const makeApiRequestGpt = async (question: string) => {
        lastQuestionRef.current = question;

        error && setError(undefined);
        setIsLoading(true);
        setActiveCitation(undefined);
        setActiveAnalysisPanelTab(undefined);

        try {
            const history: ChatTurn[] = answers.map(a => ({ user: a[0], bot: a[1].answer }));
            const request: ChatRequestGpt = {
                history: [...history, { user: question, bot: undefined }],
                approach: Approaches.ReadRetrieveRead,
                conversation_id: userId,
                query: question,
                overrides: {
                    promptTemplate: promptTemplate.length === 0 ? undefined : promptTemplate,
                    excludeCategory: excludeCategory.length === 0 ? undefined : excludeCategory,
                    top: retrieveCount,
                    semanticRanker: useSemanticRanker,
                    semanticCaptions: useSemanticCaptions,
                    suggestFollowupQuestions: useSuggestFollowupQuestions
                }
            };
            const result = await chatApiGpt(request);
            console.log(result);
            console.log(result.answer);
            setAnswers([...answers, [question, result]]);
            setUserId(result.conversation_id);

            // Voice Synthesis
            if (speechSynthesisEnabled) {
                const tokenObj = await getTokenOrRefresh();
                const speechConfig = SpeechConfig.fromAuthorizationToken(tokenObj.authToken, tokenObj.region);
                const audioConfig = AudioConfig.fromDefaultSpeakerOutput();
                speechConfig.speechSynthesisLanguage = tokenObj.speechSynthesisLanguage;
                speechConfig.speechSynthesisVoiceName = tokenObj.speechSynthesisVoiceName;
                const synthesizer = new SpeechSynthesizer(speechConfig, audioConfig);

                synthesizer.speakTextAsync(
                    result.answer.replace(/ *\[[^)]*\] */g, ""),
                    function (result) {
                        if (result.reason === ResultReason.SynthesizingAudioCompleted) {
                            console.log("synthesis finished.");
                        } else {
                            console.error("Speech synthesis canceled, " + result.errorDetails + "\nDid you update the subscription info?");
                        }
                        synthesizer.close();
                    },
                    function (err) {
                        console.trace("err - " + err);
                        synthesizer.close();
                    }
                );
            }
        } catch (e) {
            setError(e);
        } finally {
            setIsLoading(false);
        }
    };

    const clearChat = () => {
        console.log("file is" + fileType);
        lastQuestionRef.current = "";
        error && setError(undefined);
        setActiveCitation(undefined);
        setActiveAnalysisPanelTab(undefined);
        setAnswers([]);
        setUserId("");
    };

    /**Get Pdf */
    const getPdf = async (pdfName: string) => {
        /** get file type */
        let type = getFileType(pdfName);
        setFileType(type);

        try {
            const response = await fetch("/api/get-blob", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    blob_name: pdfName
                })
            });

            if (!response.ok) {
                throw new Error(`Error fetching DOC: ${response.status}`);
            }

            return await response.blob();
        } catch (error) {
            console.error(error);
            throw new Error("Error fetching DOC.");
        }
    };



    let error_message_text = "";
    if (userLanguage.startsWith("pt")) {
        error_message_text = "Desculpe, tive um problema técnico com a solicitação. Por favor informar o erro a equipe de suporte. ";
    } else if (userLanguage.startsWith("es")) {
        error_message_text = "Lo siento, yo tuve un problema con la solicitud. Por favor informe el error al equipo de soporte. ";
    } else {
        error_message_text = "I'm sorry, I had a problem with the request. Please report the error to the support team. ";
    }
    

    useEffect(() => {
        chatMessageStreamEnd.current?.scrollIntoView({ behavior: "smooth" });
        if (triggered.current === false) {
            triggered.current = true;
            console.log(triggered.current);
        }
        
    if (userLanguage.startsWith("pt")) {
        setPlaceholderText("Escreva aqui sua pergunta");
    }
    if (userLanguage.startsWith("es")) {
        setPlaceholderText("Escribe tu pregunta aqui");
    } else {
        setPlaceholderText("Write your question here");
    }
    }, [isLoading]);
    useEffect(()=>{
        if (userLanguage.startsWith("pt")) {
            setPlaceholderText("Escreva aqui sua pergunta");
        }
        if (userLanguage.startsWith("es")) {
            setPlaceholderText("Escribe tu pregunta aqui");
        } else {
            setPlaceholderText("Write your question here");
        }
    },[userLanguage])

    const onPromptTemplateChange = (_ev?: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
        setPromptTemplate(newValue || "");
    };

    const onRetrieveCountChange = (_ev?: React.SyntheticEvent<HTMLElement, Event>, newValue?: string) => {
        setRetrieveCount(parseInt(newValue || "3"));
    };

    const onUseSemanticRankerChange = (_ev?: React.FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean) => {
        setUseSemanticRanker(!!checked);
    };

    const onUseSemanticCaptionsChange = (_ev?: React.FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean) => {
        setUseSemanticCaptions(!!checked);
    };

    const onExcludeCategoryChanged = (_ev?: React.FormEvent, newValue?: string) => {
        setExcludeCategory(newValue || "");
    };

    const onUseSuggestFollowupQuestionsChange = (_ev?: React.FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean) => {
        setUseSuggestFollowupQuestions(!!checked);
    };

    const onExampleClicked = (example: string) => {
        makeApiRequestGpt(example);
    };

    const onShowCitation = async (citation: string, fileName: string, index: number) => {
        const response = await getPdf(fileName);
        if (activeCitation === citation && activeAnalysisPanelTab === AnalysisPanelTabs.CitationTab && selectedAnswer === index) {
            setActiveAnalysisPanelTab(undefined);
        } else {
            //var file = new Blob([response as BlobPart], { type: "application/pdf" });
            var file = new Blob([response as BlobPart]);

            readFile(file);

            function readFile(input: Blob) {
                const fr = new FileReader();
                fr.readAsDataURL(input);
                fr.onload = function (event) {
                    const res: any = event.target ? event.target.result : undefined;
                    setActiveCitation(res);
                };
            }
            setActiveAnalysisPanelTab(AnalysisPanelTabs.CitationTab);
        }

        setSelectedAnswer(index);
    };

    // const onShowCitation = (citation: string, index: number) => {
    //     if (activeCitation === citation && activeAnalysisPanelTab === AnalysisPanelTabs.CitationTab && selectedAnswer === index) {
    //         setActiveAnalysisPanelTab(undefined);
    //     } else {
    //         setActiveCitation(citation);
    //         setActiveAnalysisPanelTab(AnalysisPanelTabs.CitationTab);
    //     }

    //     setSelectedAnswer(index);
    // };

    const onToggleTab = (tab: AnalysisPanelTabs, index: number) => {
        if (activeAnalysisPanelTab === tab && selectedAnswer === index) {
            setActiveAnalysisPanelTab(undefined);
        } else {
            setActiveAnalysisPanelTab(tab);
        }

        setSelectedAnswer(index);
    };

    const {seeCH, setSeeCH} = useContext(darkContext)

    const toggleConversation =()=>{
        setSeeCH(prev => !prev)

}
    const preguntas = [
        "¿Tenemos productos de pasarelas de pago?"
        ,"¿La compañía tiene soluciones para empresas facturadoras?"
        ,"¿Qué aplicaciones y servicios posee la compañía?"
        // ,"¿Cómo puedo enviar dinero a otra persona usando ATH Móvil?"
    ]

    const {starter, setStarter} = useContext(darkContext)

    
    const handleStarter = (start:string) =>{
        setStarter(start)
    }

    return (
        <div className={`${isDark ? styles.container:styles.containerDark }`}>
             
            <div className={styles.commandsContainer}>
                {/* <ConversationHistoryButton  className={styles.commandButton} onClick={toggleConversation} disabled={!lastQuestionRef.current || isLoading}/> */}
                <ClearChatButton className={styles.commandButton} onClick={clearChat} disabled={!lastQuestionRef.current || isLoading} />
            </div>
            <div className={styles.chatRoot}>
                <div className={styles.chatContainer}>
                    {!lastQuestionRef.current ? (
                        <div className={styles.chatEmptyState}>
                            {/* <div className={`${isDark ? styles.conversationStarters:styles.conversationStartersDark }`}>Conversation Starters</div> */}
                            
                            <div className={styles.conversationStartersOptions}>
                                <div className={styles.conversationStarterOption} onClick={()=> handleStarter(preguntas[0])}>{preguntas[0]}</div>
                                <div className={styles.conversationStarterOption} onClick={()=> handleStarter(preguntas[1])}>{preguntas[1]}</div>
                                <div className={styles.conversationStarterOption} onClick={()=> handleStarter(preguntas[2])}>{preguntas[2]}</div>
                                {/* <div className={styles.conversationStarterOption} onClick={()=> handleStarter(preguntas[3])}>{preguntas[3]}</div> */}
                            </div>
                            {/* <SparkleFilled fontSize={"120px"} primaryFill={"rgba(115, 118, 225, 1)"} aria-hidden="true" aria-label="Chat logo" />
                            <h1 className={styles.chatEmptyStateTitle}>Conversación con datos</h1> */}
                        </div>
                    ) : (
                        <div className={styles.chatMessageStream}>
                            {answers.map((answer, index) => (
                                <div key={index}>
                                    <UserChatMessage message={answer[0]} />
                                    <div className={styles.chatMessageGpt}>
                                        <Answer
                                            key={index}
                                            answer={answer[1]}
                                            isSelected={selectedAnswer === index && activeAnalysisPanelTab !== undefined}
                                            onCitationClicked={(c, n) => onShowCitation(c, n, index)}
                                            onThoughtProcessClicked={() => onToggleTab(AnalysisPanelTabs.ThoughtProcessTab, index)}
                                            onSupportingContentClicked={() => onToggleTab(AnalysisPanelTabs.SupportingContentTab, index)}
                                            onFollowupQuestionClicked={q => makeApiRequestGpt(q)}
                                            showFollowupQuestions={false}
                                            showSources={true}
                                        />
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <>
                                    <UserChatMessage message={lastQuestionRef.current} />
                                    <div className={styles.chatMessageGptMinWidth}>
                                        <AnswerLoading />
                                    </div>
                                </>
                            )}
                            {error ? (
                                <>
                                    <UserChatMessage message={lastQuestionRef.current} />
                                    <div className={styles.chatMessageGptMinWidth}>
                                        <AnswerError error={error_message_text + error.toString()} onRetry={() => makeApiRequestGpt(lastQuestionRef.current)} />
                                    </div>
                                </>
                            ) : null}
                            <div ref={chatMessageStreamEnd} />
                        </div>
                    )}

                    <div className={styles.chatInput}>
                        <QuestionInput clearOnSend  placeholder={placeholderText} disabled={isLoading} onSend={question => makeApiRequestGpt(question)} />
                    </div>
                </div>
              

                {answers.length > 0 && fileType !== "" && activeAnalysisPanelTab && (
                    <AnalysisPanel
                        className={styles.chatAnalysisPanel}
                        activeCitation={activeCitation}
                        onActiveTabChanged={x => onToggleTab(x, selectedAnswer)}
                        citationHeight="810px"
                        answer={answers[selectedAnswer][1]}
                        activeTab={activeAnalysisPanelTab}
                        fileType={fileType}
                    />
                )}

                <Panel
                    headerText="Configure answer generation"
                    isOpen={isConfigPanelOpen}
                    isBlocking={false}
                    onDismiss={() => setIsConfigPanelOpen(false)}
                    closeButtonAriaLabel="Close"
                    onRenderFooterContent={() => <DefaultButton onClick={() => setIsConfigPanelOpen(false)}>Close</DefaultButton>}
                    isFooterAtBottom={true}
                >
                    <TextField
                        className={styles.chatSettingsSeparator}
                        defaultValue={promptTemplate}
                        label="Override prompt template"
                        multiline
                        autoAdjustHeight
                        onChange={onPromptTemplateChange}
                    />

                    <SpinButton
                        className={styles.chatSettingsSeparator}
                        label="Retrieve this many documents from search:"
                        min={1}
                        max={50}
                        defaultValue={retrieveCount.toString()}
                        onChange={onRetrieveCountChange}
                    />
                    <TextField className={styles.chatSettingsSeparator} label="Exclude category" onChange={onExcludeCategoryChanged} />
                    <Checkbox
                        className={styles.chatSettingsSeparator}
                        checked={useSemanticRanker}
                        label="Use semantic ranker for retrieval"
                        onChange={onUseSemanticRankerChange}
                    />
                    <Checkbox
                        className={styles.chatSettingsSeparator}
                        checked={useSemanticCaptions}
                        label="Use query-contextual summaries instead of whole documents"
                        onChange={onUseSemanticCaptionsChange}
                        disabled={!useSemanticRanker}
                    />
                    <Checkbox
                        className={styles.chatSettingsSeparator}
                        checked={useSuggestFollowupQuestions}
                        label="Suggest follow-up questions"
                        onChange={onUseSuggestFollowupQuestionsChange}
                    />
                </Panel>
            </div>
        </div>
    );
};

export default Chat;
