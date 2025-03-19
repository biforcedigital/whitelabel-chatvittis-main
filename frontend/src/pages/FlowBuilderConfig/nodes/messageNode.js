import React, { memo, useEffect, useState, useCallback } from "react";
import {
  Box,
  Typography,
  IconButton,
  Chip,
  Paper
} from "@mui/material";
import {
  Message,
  Code as VariablesIcon,
  ContentCopy as ContentCopyIcon,
  DeleteOutline as DeleteOutlineIcon
} from "@mui/icons-material";

import { Handle } from "react-flow-renderer";
import { useNodeStorage } from "../../../stores/useNodeStorage";
import { processVariablesInText } from "../../../utils/variableUtils";

export default memo(({ data, isConnectable, id }) => {
  const storageItems = useNodeStorage();
  const [processedText, setProcessedText] = useState(data.label || "");
  

  // Extrair variáveis do texto (formato ${variableName})
  const extractVariables = (text) => {
    if (!text) return [];
    const regex = /\$\{([^}]+)\}/g;
    const matches = [];
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      matches.push(match[1]);
    }
    
    return [...new Set(matches)]; // Remover duplicatas
  };

  const updateProcessedText = useCallback(() => {
    const originalText = data.label || "";
    const newText = processVariablesInText(originalText);
    setProcessedText(newText);
  }, [data.label]);
  

  useEffect(() => {
    updateProcessedText();

    const handleVariableUpdate = () => {
      console.log('[messageNode] Detectada atualização de variáveis');
      updateProcessedText();
    };
 
    window.addEventListener('flowVariableUpdate', handleVariableUpdate);
    
 
    const intervalId = setInterval(() => {
      updateProcessedText();
    }, 500);
    
    // Limpeza ao desmontar o componente
    return () => {
      window.removeEventListener('flowVariableUpdate', handleVariableUpdate);
      clearInterval(intervalId);
    };
  }, [data.label, updateProcessedText]);

  return (
    <Box
      sx={{
        backgroundColor: "#fff",
        borderRadius: 2,
        boxShadow: 2,
        p: 2,
        width: 280,
        display: "flex",
        flexDirection: "column",
        gap: 1,
        position: "relative",
        border: "1px solid rgba(25, 118, 210, 0.1)"
      }}
    >
      <Handle
        type="target"
        position="left"
        style={{
          left: -8,
          top: "50%",
          transform: "translateY(-50%)",
          background: "#555",
          width: 12,
          height: 12,
          cursor: 'pointer'
        }}
        onConnect={params => console.log("handle onConnect", params)}
        isConnectable={isConnectable}
      />

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Message fontSize="small" sx={{ color: '#6865A5' }} />
          <Typography variant="subtitle1" fontWeight="bold">
            Mensagem
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <IconButton
            size="small"
            onClick={() => {
              storageItems.setNodesStorage(id);
              storageItems.setAct("duplicate");
            }}
          >
            <ContentCopyIcon fontSize="small" />
          </IconButton>
          
          <IconButton
            size="small"
            onClick={() => {
              storageItems.setNodesStorage(id);
              storageItems.setAct("delete");
            }}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      <Paper elevation={0} sx={{ 
        bgcolor: '#f0f7ff', 
        p: 1.5, 
        borderRadius: 1, 
        minHeight: '60px',
        overflow: 'auto',
        maxHeight: '150px',
        wordBreak: 'break-word',
        border: '1px solid rgba(25, 118, 210, 0.1)'
      }}>
        {/* Duas formas de renderização: uma para edição/preview (mostrando chips) e outra para exibição (texto processado) */}
        {data.label ? (
          <Box>
            {/* Renderizamos os chips para variáveis apenas no modo de edição */}
            {window.location.pathname.includes('/flowbuilder-config') ? (
              // Modo de edição - mostrar variáveis como chips
              data.label.split(/\$\{([^}]+)\}/).map((part, index) => {
                // Se índice é par, é texto normal; se é ímpar, é uma variável
                if (index % 2 === 0) {
                  return <Typography key={index} variant="body2" component="span">{part}</Typography>;
                } else {
                  // Este é um nome de variável
                  return (
                    <Chip
                      key={index}
                      label={part}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.75rem',
                        bgcolor: 'rgba(76, 175, 80, 0.1)',
                        color: '#4caf50',
                        border: '1px solid rgba(76, 175, 80, 0.2)',
                        my: 0.25,
                        mx: 0.5,
                        '& .MuiChip-label': { px: 1 }
                      }}
                    />
                  );
                }
              })
            ) : (
              // Modo de execução - mostrar texto com variáveis substituidas
              <Typography variant="body2">{processedText}</Typography>
            )}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            Mensagem vazia
          </Typography>
        )}
      </Paper>
      
      {/* Indicador de variáveis se o texto contiver referências a variáveis */}
      {data.label && data.label.includes("${") && (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          mt: 0.5,
          bgcolor: 'rgba(76, 175, 80, 0.05)',
          p: 0.75,
          borderRadius: 1
        }}>
          <VariablesIcon fontSize="small" sx={{ color: '#4caf50', width: 16, height: 16 }} />
          <Typography variant="caption" color="success.main">
            Usando variáveis: {extractVariables(data.label).join(', ')}
          </Typography>
        </Box>
      )}
      
      <Handle
        type="source"
        position="right"
        id="a"
        style={{
          right: -8,
          top: "50%",
          transform: "translateY(-50%)",
          background: "#555",
          width: 12,
          height: 12,
          cursor: 'pointer'
        }}
        isConnectable={isConnectable}
      />
    </Box>
  );
});