import AppError from "../../errors/AppError";
import { WebhookModel } from "../../models/Webhook";
import { sendMessageFlow } from "../../controllers/MessageController";
import { IConnections, INodes } from "./DispatchWebHookService";
import { Request, Response } from "express";

declare global {
  namespace NodeJS {
    interface Global {
      flowVariables: Record<string, any>;
    }
  }
}

if (!global.flowVariables) {
  global.flowVariables = {};
}
import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";
import CreateContactService from "../ContactServices/CreateContactService";
import Contact from "../../models/Contact";
import CreateTicketService from "../TicketServices/CreateTicketService";
import CreateTicketServiceWebhook from "../TicketServices/CreateTicketServiceWebhook";
import { SendMessage } from "../../helpers/SendMessage";
import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import Ticket from "../../models/Ticket";
import fs from "fs";
import GetWhatsappWbot from "../../helpers/GetWhatsappWbot";
import path from "path";
import SendWhatsAppMedia from "../WbotServices/SendWhatsAppMedia";
import SendWhatsAppMediaFlow, {
  typeSimulation
} from "../WbotServices/SendWhatsAppMediaFlow";
import { randomizarCaminho } from "../../utils/randomizador";
import { SendMessageFlow } from "../../helpers/SendMessageFlow";
import formatBody from "../../helpers/Mustache";
import SetTicketMessagesAsRead from "../../helpers/SetTicketMessagesAsRead";
import SendWhatsAppMessage from "../WbotServices/SendWhatsAppMessage";
import ShowTicketService from "../TicketServices/ShowTicketService";
import CreateMessageService, {
  MessageData
} from "../MessageServices/CreateMessageService";
import { randomString } from "../../utils/randomCode";
import ShowQueueService from "../QueueService/ShowQueueService";
import { getIO } from "../../libs/socket";
import UpdateTicketService from "../TicketServices/UpdateTicketService";
import FindOrCreateATicketTrakingService from "../TicketServices/FindOrCreateATicketTrakingService";
import logger from "../../utils/logger";
import CreateLogTicketService from "../TicketServices/CreateLogTicketService";
import CompaniesSettings from "../../models/CompaniesSettings";
import ShowWhatsAppService from "../WhatsappService/ShowWhatsAppService";
import { delay } from "bluebird";
import axios from "axios";
import https from "https";

interface IAddContact {
  companyId: number;
  name: string;
  phoneNumber: string;
  email?: string;
  dataMore?: any;
}

const processVariableValue = (text: string, dataWebhook: any, ticketId?: number): string => {
  if (!text) return "";
  

  if (text.includes("${")) {
    const regex = /\${([^}]+)}/g;
    let match;
    let processedText = text;
    
    while ((match = regex.exec(text)) !== null) {
      const variableName = match[1];
      
    
      let variableValue = null;

      if (ticketId) {
        const ticketSpecificVar = `${ticketId}_${variableName}`;
        variableValue = global.flowVariables[ticketSpecificVar];
      }
      
   
      if (variableValue === null || variableValue === undefined) {
        variableValue = global.flowVariables[variableName];
      }
      
   
      if (variableValue !== null && variableValue !== undefined) {
        processedText = processedText.replace(
          match[0],
          variableValue.toString()
        );
      }
    }
    
    return processedText;
  }
  
  return text;
};

const compareValues = (value1: string, value2: string, operator: string): boolean => {
  if (!value1 && operator !== "isEmpty" && operator !== "isNotEmpty") {
    value1 = "";
  }
  
  if (!value2 && operator !== "isEmpty" && operator !== "isNotEmpty") {
    value2 = "";
  }
  

  const strValue1 = String(value1 || "").toLowerCase();
  const strValue2 = String(value2 || "").toLowerCase();
  

  const numValue1 = parseFloat(value1);
  const numValue2 = parseFloat(value2);
  
  logger.info(`Comparing values: "${value1}" ${operator} "${value2}" (lowercase: "${strValue1}" ${operator} "${strValue2}")`);
  
  switch (operator) {
    case "contains":
      return strValue1.includes(strValue2);
    case "equals":
      return strValue1 === strValue2;
    case "notEquals":
      return strValue1 !== strValue2;
    case "greaterThan":
      return !isNaN(numValue1) && !isNaN(numValue2) && numValue1 > numValue2;
    case "lessThan":
      return !isNaN(numValue1) && !isNaN(numValue2) && numValue1 < numValue2;
    case "greaterOrEqual":
      return !isNaN(numValue1) && !isNaN(numValue2) && numValue1 >= numValue2;
    case "lessOrEqual":
      return !isNaN(numValue1) && !isNaN(numValue2) && numValue1 <= numValue2;
    case "startsWith":
      return strValue1.startsWith(strValue2);
    case "endsWith":
      return strValue1.endsWith(strValue2);
    case "isEmpty":
      return !strValue1 || strValue1.trim() === "";
    case "isNotEmpty":
      return strValue1 && strValue1.trim() !== "";
    default:
      logger.error(`Unknown operator: ${operator}`);
      return false;
  }
};

export const ActionsWebhookService = async (
  whatsappId: number,
  idFlowDb: number,
  companyId: number,
  nodes: INodes[],
  connects: IConnections[],
  nextStage: string,
  dataWebhook: any,
  details: any,
  hashWebhookId: string,
  pressKey?: string,
  idTicket?: number,
  numberPhrase: "" | { number: string; name: string; email: string } = "",
  inputResponded: boolean = false
): Promise<string> => {
  try {
    const io = getIO();
    let next = nextStage;

    let createFieldJsonName = "";

    const connectStatic = connects;
    if (numberPhrase === "") {
      const nameInput = details.inputs.find(item => item.keyValue === "nome");
      nameInput.data.split(",").map(dataN => {
        const lineToData = details.keysFull.find(item => item === dataN);
        let sumRes = !lineToData
          ? dataN
          : constructJsonLine(lineToData, dataWebhook);
        createFieldJsonName = createFieldJsonName + sumRes;
      });
    } else {
      createFieldJsonName = numberPhrase.name;
    }

    let numberClient = "";

    if (numberPhrase === "") {
      const numberInput = details.inputs.find(
        item => item.keyValue === "celular"
      );

      numberInput.data.split(",").map(dataN => {
        const lineToDataNumber = details.keysFull.find(item => item === dataN);
        let createFieldJsonNumber = !lineToDataNumber
          ? dataN
          : constructJsonLine(lineToDataNumber, dataWebhook);
        numberClient = numberClient + createFieldJsonNumber;
      });
    } else {
      numberClient = numberPhrase.number;
    }

    numberClient = removerNaoLetrasNumeros(numberClient);

    if (numberClient.substring(0, 2) === "55") {
      if (parseInt(numberClient.substring(2, 4)) >= 31) {
        if (numberClient.length === 13) {
          numberClient =
            numberClient.substring(0, 4) + numberClient.substring(5, 13);
        }
      }
    }

    let createFieldJsonEmail = "";

    if (numberPhrase === "") {
      const emailInput = details.inputs.find(item => item.keyValue === "email");
      emailInput.data.split(",").map(dataN => {
        const lineToDataEmail = details.keysFull.find(item =>
          item.endsWith("email")
        );
        let sumRes = !lineToDataEmail
          ? dataN
          : constructJsonLine(lineToDataEmail, dataWebhook);
        createFieldJsonEmail = createFieldJsonEmail + sumRes;
      });
    } else {
      createFieldJsonEmail = numberPhrase.email;
    }

    const lengthLoop = nodes.length;
    const whatsapp = await GetDefaultWhatsApp(companyId, whatsappId);

    if (whatsapp.status !== "CONNECTED") {
      return;
    }

    let execCount = 0;

    let execFn = "";

    let ticket = null;

    let noAlterNext = false;

    for (var i = 0; i < lengthLoop; i++) {
      let nodeSelected: any;
      let ticketInit: Ticket;
      if (idTicket) {
        ticketInit = await Ticket.findOne({
          where: { id: idTicket, whatsappId }
        });

        if (ticketInit.status === "closed") {
          break;
        } else {
          await ticketInit.update({
            dataWebhook: {
              status: "process"
            }
          });
        }
      }

      if (pressKey) {
        if (pressKey === "parar") {
          if (idTicket) {
            ticketInit = await Ticket.findOne({
              where: { id: idTicket, whatsappId }
            });
            await ticket.update({
              status: "closed"
            });
          }
          break;
        }

        if (execFn === "") {
          nodeSelected = {
            type: "menu"
          };
        } else {
          nodeSelected = nodes.filter(node => node.id === execFn)[0];
        }
      } else {
        const otherNode = nodes.filter(node => node.id === next)[0];
        if (otherNode) {
          nodeSelected = otherNode;
        }
      }

      if (nodeSelected.type === "message") {
        let msg;
        if (dataWebhook === "") {
          msg = {
            body: nodeSelected.data.label,
            number: numberClient,
            companyId: companyId
          };
        } else {
          const dataLocal = {
            nome: createFieldJsonName,
            numero: numberClient,
            email: createFieldJsonEmail
          };
          msg = {
            body: replaceMessages(
              nodeSelected.data.label,
              details,
              dataWebhook,
              dataLocal
            ),
            number: numberClient,
            companyId: companyId
          };
        }

        await SendMessage(whatsapp, {
          number: numberClient,
          body: msg.body
        });

        await intervalWhats("1");
      }

      if (nodeSelected.type === "input") {
        try {
    
          let question = nodeSelected.data.question || "";
          const variableName = nodeSelected.data.variableName || "";
          
          if (!variableName) {
            console.error("[inputNode] Nome da variável não definido no nó de input");
            continue;
          }

        
        
          if (question.includes("${")) {
            const dataLocal = {
              nome: createFieldJsonName,
              numero: numberClient,
              email: createFieldJsonEmail
            };
            
            question = replaceMessages(
              question,
              details,
              dataWebhook,
              dataLocal
            );
          }

            
          if (inputResponded || (ticket && ticket.dataWebhook && ticket.dataWebhook.waitingInput)) {
          }else{
          
        
          await intervalWhats("1");
          typeSimulation(ticket, "composing")

         
          await SendMessage(whatsapp, {
            number: numberClient,
            body: question
          });
        }
        
          if (ticket) {
      
            const inputIdentifier = `${ticket.id}_${variableName}`;
            
            await ticket.update({
              status: "pending",
              lastFlowId: nodeSelected.id,
              flowWebhook: true,
              hashFlowId: hashWebhookId,
              flowStopped: idFlowDb.toString(),
              dataWebhook: {
                ...ticket.dataWebhook,
                waitingInput: true,
                inputVariableName: variableName,
                inputIdentifier: inputIdentifier
              }
            });
            
   
            global.flowVariables = global.flowVariables || {};
            global.flowVariables[`${inputIdentifier}_next`] = next;
         
            break;
          }
        } catch (error) {
          console.error("[inputNode] Erro ao processar nó de input:", error);
        }
      }

      if (nodeSelected.type === "conditionCompare") {
        try {
         
 
          const leftValue = processVariableValue(
            nodeSelected.data.leftValue || "",
            dataWebhook,
            idTicket
          );
    
          const rightValue = nodeSelected.data.operator !== "isEmpty" && 
                             nodeSelected.data.operator !== "isNotEmpty" 
                                ? processVariableValue(
                                    nodeSelected.data.rightValue || "",
                                    dataWebhook,
                                    idTicket
                                  )
                                : "";
          

          const comparisonResult = compareValues(
            leftValue,
            rightValue,
            nodeSelected.data.operator
          );
          
         

          const condition = comparisonResult ? "true" : "false";
          
     
          const connectionSelect = connectStatic.filter(
            item => item.source === nodeSelected.id && item.sourceHandle === condition
          );

      
          
          if (connectionSelect && connectionSelect.length > 0) {
            next = connectionSelect[0].target;
            noAlterNext = true;
 
            continue;
          } else {
            logger.warn(`[FlowBuilder] No connection found for condition ${condition} on node ${nodeSelected.id}`);
            
    
            const allConnections = connectStatic.filter(
              item => item.source === nodeSelected.id
            );
        
           
          }
        } catch (error) {
     
          const connectionFalse = connectStatic.filter(
            item => item.source === nodeSelected.id && item.sourceHandle === "false"
          );
          
          if (connectionFalse && connectionFalse.length > 0) {
            next = connectionFalse[0].target;
            noAlterNext = true;
          }
        }
      }

      if (nodeSelected.type === "ticket") {
        const queue = await ShowQueueService(
          nodeSelected.data.data.id,
          companyId
        );

        await ticket.update({
          status: "pending",
          queueId: queue.id,
          userId: ticket.userId,
          companyId: companyId,
          flowWebhook: true,
          lastFlowId: nodeSelected.id,
          hashFlowId: hashWebhookId,
          flowStopped: idFlowDb.toString()
        });

        await FindOrCreateATicketTrakingService({
          ticketId: ticket.id,
          companyId,
          whatsappId: ticket.whatsappId,
          userId: ticket.userId
        });

        await UpdateTicketService({
          ticketData: {
            status: "pending",
            queueId: queue.id
          },
          ticketId: ticket.id,
          companyId
        });

        await CreateLogTicketService({
          ticketId: ticket.id,
          type: "queue",
          queueId: queue.id
        });

        let settings = await CompaniesSettings.findOne({
          where: {
            companyId: companyId
          }
        });

        const { queues, greetingMessage, maxUseBotQueues, timeUseBotQueues } =
          await ShowWhatsAppService(whatsappId, companyId);

        if (greetingMessage.length > 1) {
          const body = formatBody(`${greetingMessage}`, ticket);

          const ticketDetails = await ShowTicketService(ticket.id, companyId);

          await ticketDetails.update({
            lastMessage: formatBody(queue.greetingMessage, ticket.contact)
          });

          await SendWhatsAppMessage({
            body,
            ticket: ticketDetails,
            quotedMsg: null
          });

          SetTicketMessagesAsRead(ticketDetails);
        }
      }

      if (nodeSelected.type === "variable") {
        try {
          const variableName = nodeSelected.data.variableName;
          const variableValue = nodeSelected.data.variableValue;

          if (variableName) {
            global.flowVariables = global.flowVariables || {};
            global.flowVariables[variableName] = variableValue;
          }
        } catch (error) {
          console.error("Erro ao processar nó de variável:", error);
        }
      }

      if (nodeSelected.type === "httpRequest") {
        try {
          const {
            url,
            method,
            requestBody,
            headersString,
            queryParams,
            saveVariables,
            responseVariables,
            timeout
          } = nodeSelected.data;

          if (!url) {
            console.error(
              "[httpRequestNode] URL não definido no nó HTTP Request"
            );
            continue;
          }

          let headers = {};
          try {
            if (headersString && typeof headersString === "string") {
              headers = JSON.parse(headersString);
            } else if (typeof headersString === "object") {
              headers = headersString;
            }
          } catch (err) {
            console.error(
              "[httpRequestNode] Erro ao parsear headers JSON:",
              err
            );
          }

          let body = null;
          if (
            ["POST", "PUT", "PATCH", "DELETE"].includes(
              method?.toUpperCase() || "GET"
            )
          ) {
            try {
              body =
                requestBody && typeof requestBody === "string"
                  ? requestBody.trim().startsWith("{")
                    ? JSON.parse(requestBody)
                    : requestBody
                  : null;
            } catch (err) {
              console.error(
                "[httpRequestNode] Erro ao parsear body JSON, usando como string:",
                err
              );
              body = requestBody;
            }
          }

          const requestTimeout = timeout || 10000;

          const response = await makeHttpRequest(
            url,
            method || "GET",
            headers,
            body,
            queryParams,
            requestTimeout
          );

          global.flowVariables = global.flowVariables || {};
          global.flowVariables["apiResponse"] = response.data;

          if (response.data) {
            let variablesToProcess = [];

            if (
              responseVariables &&
              Array.isArray(responseVariables) &&
              responseVariables.length > 0
            ) {
              variablesToProcess = responseVariables;
            } else if (
              saveVariables &&
              Array.isArray(saveVariables) &&
              saveVariables.length > 0
            ) {
              variablesToProcess = saveVariables.map(item => ({
                path: item.path,
                variableName: item.variable
              }));
            } else if (
              nodeSelected.data.responseVariables &&
              Array.isArray(nodeSelected.data.responseVariables)
            ) {
              variablesToProcess = nodeSelected.data.responseVariables;
            } else if (
              nodeSelected.data.saveVariables &&
              Array.isArray(nodeSelected.data.saveVariables)
            ) {
              variablesToProcess = nodeSelected.data.saveVariables.map(
                item => ({
                  path: item.path,
                  variableName: item.variable || item.variableName
                })
              );
            }

            if (variablesToProcess && variablesToProcess.length > 0) {
              for (let i = 0; i < variablesToProcess.length; i++) {
                const extractor = variablesToProcess[i];

                if (extractor && extractor.path && extractor.variableName) {
                  const parts = extractor.path.split(".");
                  let value = response.data;
                  let pathValid = true;

                  for (const part of parts) {
                    if (value && typeof value === "object" && part in value) {
                      value = value[part];
                    } else {
                      pathValid = false;
                      break;
                    }
                  }

                  if (pathValid && value !== undefined && value !== null) {
                    if (typeof setFlowVariable === "function") {
                      setFlowVariable(extractor.variableName, value);
                    } else {
                      global.flowVariables[extractor.variableName] = value;
                    }
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error(
            "[httpRequestNode] Erro ao processar nó HTTP Request:",
            error
          );
        }
      }

      if (nodeSelected.type === "singleBlock") {
        for (var iLoc = 0; iLoc < nodeSelected.data.seq.length; iLoc++) {
          const elementNowSelected = nodeSelected.data.seq[iLoc];

          let ticketUpdate = await Ticket.findOne({
            where: { id: idTicket, companyId }
          });

          if (ticketUpdate.status === "open") {
            pressKey = "999";
            execFn = undefined;

            await ticket.update({
              lastFlowId: null,
              dataWebhook: null,
              queueId: null,
              hashFlowId: null,
              flowWebhook: false,
              flowStopped: null
            });
            break;
          }

          if (ticketUpdate.status === "closed") {
            pressKey = "999";
            execFn = undefined;

            await ticket.reload();

            io.of(String(companyId))
            .emit(`company-${ticket.companyId}-ticket`, {
              action: "delete",
              ticketId: ticket.id
            });

            break;
          }

          if (elementNowSelected.includes("message")) {
            const bodyFor = nodeSelected.data.elements.filter(
              item => item.number === elementNowSelected
            )[0].value;

            const ticketDetails = await ShowTicketService(ticket.id, companyId);

            let msg;

            if (dataWebhook === "") {
              msg = bodyFor;
            } else {
              const dataLocal = {
                nome: createFieldJsonName,
                numero: numberClient,
                email: createFieldJsonEmail
              };
              msg = replaceMessages(bodyFor, details, dataWebhook, dataLocal);
            }

            await delay(3000);
            await typeSimulation(ticket, "composing");

            await SendWhatsAppMessage({
              body: msg,
              ticket: ticketDetails,
              quotedMsg: null
            });

            SetTicketMessagesAsRead(ticketDetails);

            await ticketDetails.update({
              lastMessage: formatBody(msg, ticket.contact)
            });

            await intervalWhats("1");
          }
          if (elementNowSelected.includes("interval")) {
            await intervalWhats(
              nodeSelected.data.elements.filter(
                item => item.number === elementNowSelected
              )[0].value
            );
          }

          if (elementNowSelected.includes("img")) {
            await typeSimulation(ticket, "composing");

            await SendMessage(whatsapp, {
              number: numberClient,
              body: "",
              mediaPath:
                process.env.BACKEND_URL === "http://localhost:8090"
                  ? `${__dirname.split("src")[0].split("\\").join("/")}public/${
                      nodeSelected.data.elements.filter(
                        item => item.number === elementNowSelected
                      )[0].value
                    }`
                  : `${__dirname
                      .split("dist")[0]
                      .split("\\")
                      .join("/")}public/${
                      nodeSelected.data.elements.filter(
                        item => item.number === elementNowSelected
                      )[0].value
                    }`
            });
            await intervalWhats("1");
          }

          if (elementNowSelected.includes("audio")) {
            const mediaDirectory =
              process.env.BACKEND_URL === "http://localhost:8090"
                ? `${__dirname.split("src")[0].split("\\").join("/")}public/${
                    nodeSelected.data.elements.filter(
                      item => item.number === elementNowSelected
                    )[0].value
                  }`
                : `${__dirname.split("dist")[0].split("\\").join("/")}public/${
                    nodeSelected.data.elements.filter(
                      item => item.number === elementNowSelected
                    )[0].value
                  }`;
            const ticketInt = await Ticket.findOne({
              where: { id: ticket.id }
            });

            await typeSimulation(ticket, "recording");

            await SendWhatsAppMediaFlow({
              media: mediaDirectory,
              ticket: ticketInt,
              isRecord: nodeSelected.data.elements.filter(
                item => item.number === elementNowSelected
              )[0].record
            });

            await intervalWhats("1");
          }
          if (elementNowSelected.includes("video")) {
            const mediaDirectory =
              process.env.BACKEND_URL === "http://localhost:8090"
                ? `${__dirname.split("src")[0].split("\\").join("/")}public/${
                    nodeSelected.data.elements.filter(
                      item => item.number === elementNowSelected
                    )[0].value
                  }`
                : `${__dirname.split("dist")[0].split("\\").join("/")}public/${
                    nodeSelected.data.elements.filter(
                      item => item.number === elementNowSelected
                    )[0].value
                  }`;
            const ticketInt = await Ticket.findOne({
              where: { id: ticket.id }
            });

            await typeSimulation(ticket, "recording");

            await SendWhatsAppMediaFlow({
              media: mediaDirectory,
              ticket: ticketInt
            });

            await intervalWhats("1");
          }
          if (elementNowSelected.includes("pdf")) {
            await typeSimulation(ticket, "composing");

            await SendMessage(whatsapp, {
              number: numberClient,
              body: "",
              mediaPath:
                process.env.BACKEND_URL === "http://localhost:8090"
                  ? `${__dirname.split("src")[0].split("\\").join("/")}public/${
                      nodeSelected.data.elements.filter(
                        item => item.number === elementNowSelected
                      )[0].value
                    }`
                  : `${__dirname
                      .split("dist")[0]
                      .split("\\")
                      .join("/")}public/${
                      nodeSelected.data.elements.filter(
                        item => item.number === elementNowSelected
                      )[0].value
                    }`
            });
            await intervalWhats("1");
          }
        }
      }

      let isRandomizer: boolean;
      if (nodeSelected.type === "randomizer") {
        const selectedRandom = randomizarCaminho(
          nodeSelected.data.percent / 100
        );

        const resultConnect = connects.filter(
          connect => connect.source === nodeSelected.id
        );
        if (selectedRandom === "A") {
          next = resultConnect.filter(item => item.sourceHandle === "a")[0]
            .target;
          noAlterNext = true;
        } else {
          next = resultConnect.filter(item => item.sourceHandle === "b")[0]
            .target;
          noAlterNext = true;
        }
        isRandomizer = true;
      }

      let isMenu: boolean;

      if (nodeSelected.type === "menu") {
        if (pressKey) {
          const filterOne = connectStatic.filter(
            confil => confil.source === next
          );
          const filterTwo = filterOne.filter(
            filt2 => filt2.sourceHandle === "a" + pressKey
          );
          if (filterTwo.length > 0) {
            execFn = filterTwo[0].target;
          } else {
            execFn = undefined;
          }

          if (execFn === undefined) {
            break;
          }
          pressKey = "999";

          const isNodeExist = nodes.filter(item => item.id === execFn);

          if (isNodeExist.length > 0) {
            isMenu = isNodeExist[0].type === "menu" ? true : false;
          } else {
            isMenu = false;
          }
        } else {
          let optionsMenu = "";
          nodeSelected.data.arrayOption.map(item => {
            optionsMenu += `[${item.number}] ${item.value}\n`;
          });

          const menuCreate = `${nodeSelected.data.message}\n\n${optionsMenu}`;

          let msg;
          if (dataWebhook === "") {
            msg = {
              body: menuCreate,
              number: numberClient,
              companyId: companyId
            };
          } else {
            const dataLocal = {
              nome: createFieldJsonName,
              numero: numberClient,
              email: createFieldJsonEmail
            };
            msg = {
              body: replaceMessages(
                menuCreate,
                details,
                dataWebhook,
                dataLocal
              ),
              number: numberClient,
              companyId: companyId
            };
          }

          const ticketDetails = await ShowTicketService(ticket.id, companyId);

          const messageData: MessageData = {
            wid: randomString(50),
            ticketId: ticket.id,
            body: msg.body,
            fromMe: true,
            read: true
          };

          await typeSimulation(ticket, "composing");

          await SendWhatsAppMessage({
            body: msg.body,
            ticket: ticketDetails,
            quotedMsg: null
          });

          SetTicketMessagesAsRead(ticketDetails);

          await ticketDetails.update({
            lastMessage: formatBody(msg.body, ticket.contact)
          });

          await intervalWhats("1");

          if (ticket) {
            ticket = await Ticket.findOne({
              where: {
                id: ticket.id,
                whatsappId: whatsappId,
                companyId: companyId
              }
            });
          } else {
            ticket = await Ticket.findOne({
              where: {
                id: idTicket,
                whatsappId: whatsappId,
                companyId: companyId
              }
            });
          }

          if (ticket) {
            await ticket.update({
              queueId: ticket.queueId ? ticket.queueId : null,
              userId: null,
              companyId: companyId,
              flowWebhook: true,
              lastFlowId: nodeSelected.id,
              dataWebhook: dataWebhook,
              hashFlowId: hashWebhookId,
              flowStopped: idFlowDb.toString()
            });
          }

          break;
        }
      }

      let isContinue = false;

      if (pressKey === "999" && execCount > 0) {
        console.log(587, "ActionsWebhookService | 587");

        pressKey = undefined;
        let result = connects.filter(connect => connect.source === execFn)[0];
        if (typeof result === "undefined") {
          next = "";
        } else {
          if (!noAlterNext) {
            next = result.target;
          }
        }
      } else {
        let result;

        if (isMenu) {
          result = { target: execFn };
          isContinue = true;
          pressKey = undefined;
        } else if (isRandomizer) {
          isRandomizer = false;
          result = next;
        } else {
          result = connects.filter(connect => connect.source === next)[0];
        }

        if (typeof result === "undefined") {
          next = "";
        } else {
          if (!noAlterNext) {
            next = result.target;
          }
        }
      }

      if (!pressKey && !isContinue) {
        const nextNode = connects.filter(
          connect => connect.source === nodeSelected.id
        ).length;

        if (nextNode === 0) {
          await Ticket.findOne({
            where: { id: idTicket, whatsappId, companyId: companyId }
          });
          await ticket.update({
            lastFlowId: null,
            dataWebhook: {
              status: "process"
            },
            hashFlowId: null,
            flowWebhook: false,
            flowStopped: idFlowDb.toString()
          });
          break;
        }
      }

      isContinue = false;

      if (next === "") {
        break;
      }

      ticket = await Ticket.findOne({
        where: { id: idTicket, whatsappId, companyId: companyId }
      });

      if (ticket.status === "closed") {
        io.of(String(companyId))
        .emit(`company-${ticket.companyId}-ticket`, {
          action: "delete",
          ticketId: ticket.id
        });
      }

      await ticket.update({
        whatsappId: whatsappId,
        queueId: ticket?.queueId,
        userId: null,
        companyId: companyId,
        flowWebhook: true,
        lastFlowId: nodeSelected.id,
        dataWebhook: dataWebhook,
        hashFlowId: hashWebhookId,
        flowStopped: idFlowDb.toString()
      });

      noAlterNext = false;
      execCount++;
    }

    return "ds";
  } catch (error) {
    logger.error(error);
  }
};

const constructJsonLine = (line: string, json: any) => {
  let valor = json;
  const chaves = line.split(".");

  if (chaves.length === 1) {
    return valor[chaves[0]];
  }

  for (const chave of chaves) {
    valor = valor[chave];
  }
  return valor;
};

function removerNaoLetrasNumeros(texto: string) {
  return texto.replace(/[^a-zA-Z0-9]/g, "");
}

const sendMessageWhats = async (
  whatsId: number,
  msg: any,
  req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>
) => {
  sendMessageFlow(whatsId, msg, req);
  return Promise.resolve();
};

const intervalWhats = (time: string) => {
  const seconds = parseInt(time) * 1000;
  return new Promise(resolve => setTimeout(resolve, seconds));
};

const makeHttpRequest = async (
  url: string,
  method: string,
  headers: Record<string, string> = {},
  body: any = null,
  queryParams: Array<{ key: string; value: string }> = [],
  timeout: number = 10000
): Promise<any> => {
  try {
    let processedUrl = url;
    if (global.flowVariables && url.includes("${")) {
      const regex = /\${([^}]+)}/g;
      processedUrl = url.replace(regex, (match, varName) => {
        return global.flowVariables[varName] !== undefined
          ? global.flowVariables[varName]
          : match;
      });
    }

    if (queryParams) {
      try {
        const paramsArray = Array.isArray(queryParams) ? queryParams : [];

        if (paramsArray.length > 0) {
          // Processar variáveis nos parâmetros de query
          const processedParams = paramsArray.map(param => {
            if (!param || typeof param !== "object") {
              return { key: "", value: "" };
            }

            const key = param.key || "";
            let value = param.value || "";

            if (
              global.flowVariables &&
              typeof value === "string" &&
              value.includes("${")
            ) {
              const regex = /\${([^}]+)}/g;
              value = value.replace(regex, (match, varName) => {
                const replacement = global.flowVariables[varName];

                return replacement !== undefined ? String(replacement) : match;
              });
            }

            return { key, value };
          });

          const queryString = processedParams
            .filter(param => param.key && param.value)
            .map(
              param =>
                `${encodeURIComponent(param.key)}=${encodeURIComponent(
                  param.value
                )}`
            )
            .join("&");

          if (queryString) {
            console.log(
              `[httpRequestNode] Query string gerada: ${queryString}`
            );
            processedUrl = processedUrl.includes("?")
              ? `${processedUrl}&${queryString}`
              : `${processedUrl}?${queryString}`;
          }
        }
      } catch (error) {
        logger.error(error);
      }
    }

    const processedHeaders: Record<string, string> = { ...headers };
    if (global.flowVariables) {
      Object.keys(processedHeaders).forEach(key => {
        if (processedHeaders[key] && processedHeaders[key].includes("${")) {
          const regex = /\${([^}]+)}/g;
          processedHeaders[key] = processedHeaders[key].replace(
            regex,
            (match, varName) => {
              return global.flowVariables[varName] !== undefined
                ? global.flowVariables[varName]
                : match;
            }
          );
        }
      });
    }

    let processedBody = body;
    try {
      if (
        ["POST", "PUT", "PATCH", "DELETE"].includes(
          method?.toUpperCase() || ""
        ) &&
        body
      ) {
        if (typeof body === "string") {
          if (global.flowVariables && body.includes("${")) {
            const regex = /\${([^}]+)}/g;
            processedBody = body.replace(regex, (match, varName) => {
              const value = global.flowVariables[varName];

              if (value !== undefined) {
                if (typeof value === "string") {
                  return value;
                } else {
                  return JSON.stringify(value);
                }
              }
              return match;
            });
          }

          if (
            processedBody &&
            typeof processedBody === "string" &&
            (processedBody.trim().startsWith("{") ||
              processedBody.trim().startsWith("["))
          ) {
            try {
              processedBody = JSON.parse(processedBody);
            } catch (e) {}
          }
        } else if (
          typeof body === "object" &&
          body !== null &&
          global.flowVariables
        ) {
          const processObject = (obj: any): any => {
            if (obj === null || typeof obj !== "object") {
              return obj;
            }

            if (Array.isArray(obj)) {
              return obj.map(item => processObject(item));
            }

            const result: any = {};
            Object.keys(obj).forEach(key => {
              if (typeof obj[key] === "string" && obj[key].includes("${")) {
                const regex = /\${([^}]+)}/g;
                result[key] = obj[key].replace(regex, (match, varName) => {
                  const value = global.flowVariables[varName];

                  return value !== undefined
                    ? typeof value === "object"
                      ? JSON.stringify(value)
                      : value
                    : match;
                });
              } else if (typeof obj[key] === "object") {
                result[key] = processObject(obj[key]);
              } else {
                result[key] = obj[key];
              }
            });
            return result;
          };

          processedBody = processObject(body);
        }
      }
    } catch (error) {
      logger.error(error);

      processedBody = body;
    }

    const httpsAgent = new https.Agent({
      rejectUnauthorized: process.env.NODE_ENV === "production"
    });

    const limitedTimeout = Math.min(Math.max(1000, timeout), 45000);

    const config: any = {
      url: processedUrl,
      method: method.toUpperCase(),
      headers: {
        "Content-Type": "application/json",
        ...processedHeaders
      },
      httpsAgent,
      timeout: limitedTimeout
    };

    if (
      ["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase()) &&
      processedBody
    ) {
      config.data =
        typeof processedBody === "string"
          ? processedBody
          : JSON.stringify(processedBody);
    }

    const response = await axios(config);

    return {
      data: response.data,
      status: response.status,
      headers: response.headers
    };
  } catch (error) {
    logger.error(
      `Erro na requisição HTTP (${method} ${url}): ${error.message}`
    );

    if (error.response) {
      logger.error(`Resposta de erro com status ${error.response.status}`);
      return {
        data: error.response.data,
        status: error.response.status,
        headers: error.response.headers,
        error: true
      };
    }

    logger.error(`Erro sem resposta do servidor: ${error}`);
    return {
      error: true,
      message: error.message,
      status: 500
    };
  }
};

export const getFlowVariable = (name: string): any => {
  if (!global.flowVariables) {
    global.flowVariables = {};
    return undefined;
  }

  const value = global.flowVariables[name];

  return value;
};

export const setFlowVariable = (name: string, value: any): any => {
  if (!global.flowVariables) {
    global.flowVariables = {};
  }

  global.flowVariables[name] = value;

  const savedValue = global.flowVariables[name];
  if (savedValue !== value && typeof value !== "object") {
  }

  return value;
};

interface DataNoWebhook {
  nome: string;
  numero: string;
  email: string;
}

const replaceMessages = (
  message: string,
  details: any,
  dataWebhook: any,
  dataNoWebhook?: DataNoWebhook
) => {
  if (!message) return "";

  try {
    global.flowVariables = global.flowVariables || {};

    const regexNewFormat = /\$\{([^}]+)\}/g;
    let processedMessage = message.replace(regexNewFormat, (match, varName) => {
      const varValue = global.flowVariables[varName];

      if (varValue !== undefined) {
        return typeof varValue === "object"
          ? JSON.stringify(varValue)
          : String(varValue);
      }

      return match;
    });

    const matches = processedMessage.match(/\{([^}]+)\}/g);

    if (dataWebhook && dataNoWebhook) {
      let newTxt = processedMessage;
      if (dataNoWebhook.nome) {
        newTxt = newTxt.replace(/{+nome}+/g, dataNoWebhook.nome);
      }
      if (dataNoWebhook.numero) {
        newTxt = newTxt.replace(/{+numero}+/g, dataNoWebhook.numero);
      }
      if (dataNoWebhook.email) {
        newTxt = newTxt.replace(/{+email}+/g, dataNoWebhook.email);
      }

      return newTxt;
    }

    if (matches && matches.includes("inputs")) {
      const placeholders = matches.map(match => match.replace(/\{|\}/g, ""));
      let newText = processedMessage;
      placeholders.map(item => {
        const value = details["inputs"].find(
          itemLocal => itemLocal.keyValue === item
        );
        if (value) {
          const lineToData = details["keysFull"].find(itemLocal =>
            itemLocal.endsWith(`.${value.data}`)
          );
          if (lineToData) {
            const createFieldJson = constructJsonLine(lineToData, dataWebhook);
            newText = newText.replace(`{${item}}`, createFieldJson);
          }
        }
      });
      return newText;
    } else {
      return processedMessage;
    }
  } catch (error) {
    logger.error(`Erro ao processar variáveis: ${error}`);
    return message;
  }
};