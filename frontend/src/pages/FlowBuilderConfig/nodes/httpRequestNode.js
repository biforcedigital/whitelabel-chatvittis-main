import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Button,
  TextField,
  IconButton,
  Autocomplete,
  Grid,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import HttpIcon from "@mui/icons-material/Http";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import SaveAltIcon from "@mui/icons-material/SaveAlt";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import SettingsIcon from "@mui/icons-material/Settings";
import TipsAndUpdatesIcon from "@mui/icons-material/TipsAndUpdates";
import LinearScaleIcon from "@mui/icons-material/LinearScale";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import CloseIcon from "@mui/icons-material/Close";

import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/theme-github";

import ReactJson from "react-json-view";
import axios from "axios";
import { Handle } from "react-flow-renderer";
import { useNodeStorage } from "../../../stores/useNodeStorage";


function getPaths(obj, prefix = "") {
  let paths = [];
  for (let key in obj) {
    const currentPath = prefix ? `${prefix}.${key}` : key;
    paths.push(currentPath);
    if (obj[key] !== null && typeof obj[key] === "object") {
      paths = paths.concat(getPaths(obj[key], currentPath));
    }
  }
  return paths;
}

const HttpRequestNode = React.memo(({ data, id, selected }) => {

  const [url, setUrl] = useState(data?.url || "");
  const [method, setMethod] = useState(data?.method || "GET");
  const [requestBody, setRequestBody] = useState(data?.requestBody || "{}");
  const [headersString, setHeadersString] = useState(data?.headersString || "");
  const [queryParams, setQueryParams] = useState(data?.queryParams || []);
  const [saveVariables, setSaveVariables] = useState(data?.saveVariables || []);
  const [timeout, setTimeout] = useState(data?.timeout || 10000); 
  const [savedStatus, setSavedStatus] = useState('');
  

  const storageItems = useNodeStorage();


  const updateNodeData = useCallback(() => {

    data.url = url;
    data.method = method;
    data.requestBody = requestBody;
    data.headersString = headersString;
    data.queryParams = queryParams;
    data.timeout = timeout;
    

    if (saveVariables && saveVariables.length > 0) {

      data.saveVariables = saveVariables.map(item => ({
        path: item.path,
        variable: item.variable
      }));
      

      data.responseVariables = saveVariables.map(item => ({
        path: item.path,
        variableName: item.variable
      }));
      

    } else {

      data.saveVariables = [];
      data.responseVariables = [];
    }
    

    

    if (!data.responseVariables || !Array.isArray(data.responseVariables)) {

      data.responseVariables = data.saveVariables?.map(item => ({
        path: item.path,
        variableName: item.variable
      })) || [];
    }
    
    if (!data.saveVariables || !Array.isArray(data.saveVariables)) {

      data.saveVariables = data.responseVariables?.map(item => ({
        path: item.path,
        variable: item.variableName
      })) || [];
    }
    

  }, [url, method, requestBody, headersString, queryParams, saveVariables, data]);


  const [response, setResponse] = useState(null);
  const [jsonPaths, setJsonPaths] = useState([]);


  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showMapping, setShowMapping] = useState(saveVariables && saveVariables.length > 0);
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [showFullEditor, setShowFullEditor] = useState(false);
  const [showFullResponse, setShowFullResponse] = useState(false);
  

  useEffect(() => {
    if (saveVariables && saveVariables.length > 0 && !showMapping) {
      setShowMapping(true);
    }
  }, [saveVariables, showMapping]);
  

  useEffect(() => {
    let timer;
    if (showSavePopup) {
      timer = setTimeout(() => {
        setShowSavePopup(false);
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [showSavePopup]);


  const hasBody = ["POST", "PUT", "DELETE"].includes(method);


  let customHeaders = {};
  try {
    customHeaders = headersString ? JSON.parse(headersString) : {};
  } catch (err) {
  }


  useEffect(() => {
    if (response && typeof response === "object") {
      setJsonPaths(getPaths(response));
    } else {
      setJsonPaths([]);
    }
  }, [response]);


  const buildUrlWithParams = useCallback((baseUrl = url) => {
    if (!queryParams.length) return baseUrl;
    

    const processedParams = queryParams.map(param => {
      let value = param.value;
      

      if (window.flowVariables && value.includes('${')) {
        const regex = /\${([^}]+)}/g;
        value = value.replace(regex, (match, varName) => {
          return window.flowVariables[varName] !== undefined ? 
            window.flowVariables[varName] : match;
        });
      }
      
      return { key: param.key, value };
    });
    
    const queryString = processedParams
      .filter((param) => param.key && param.value)
      .map(
        (param) =>
          `${encodeURIComponent(param.key)}=${encodeURIComponent(param.value)}`
      )
      .join("&");
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }, [url, queryParams]);


  const addQueryParam = useCallback(
    () => setQueryParams([...queryParams, { key: "", value: "" }]),
    [queryParams]
  );
  const updateQueryParam = useCallback(
    (index, field, value) => {
      const newParams = [...queryParams];
      newParams[index][field] = value;
      setQueryParams(newParams);
    },
    [queryParams]
  );
  const removeQueryParam = useCallback(
    (index) => setQueryParams(queryParams.filter((_, i) => i !== index)),
    [queryParams]
  );


  const addSaveVariable = useCallback(
    () => setSaveVariables([...saveVariables, { path: "", variable: "" }]),
    [saveVariables]
  );
  const updateSaveVariable = useCallback(
    (index, field, value) => {
      const newVars = [...saveVariables];
      newVars[index][field] = value;
      setSaveVariables(newVars);
    },
    [saveVariables]
  );
  const removeSaveVariable = useCallback(
    (index) => setSaveVariables(saveVariables.filter((_, i) => i !== index)),
    [saveVariables]
  );


  useEffect(() => {

    updateNodeData();
  }, [url, method, requestBody, headersString, queryParams, saveVariables, timeout, updateNodeData]);
  

  const testRequest = useCallback(async () => {
    try {

      let processedUrl = url;

      if (window.flowVariables && url.includes('${')) {
        const regex = /\${([^}]+)}/g;
        processedUrl = url.replace(regex, (match, varName) => {
          return window.flowVariables[varName] !== undefined ? 
            window.flowVariables[varName] : match;
        });
      }

      const finalUrl = buildUrlWithParams(processedUrl);
      const config = {
        method,
        url: finalUrl,
        headers: { "Content-Type": "application/json", ...customHeaders },
        timeout: timeout,
      };


      if (hasBody) {
        try {
          let processedRequestBody = requestBody;
          

          if (window.flowVariables && requestBody.includes('${')) {
            const regex = /\${([^}]+)}/g;
            processedRequestBody = requestBody.replace(regex, (match, varName) => {
              return window.flowVariables[varName] !== undefined ? 
                JSON.stringify(window.flowVariables[varName]) : match;
            });
          }
          
          config.data = JSON.parse(processedRequestBody || "{}");
        } catch (err) {
        }
      }

      const res = await axios(config);
      setResponse(res.data);


      if (window.setFlowVariable) {
        window.setFlowVariable('apiResponse', res.data);

      }


      if (saveVariables.length > 0) {

        const variablesToProcess = [...saveVariables];
        

        const responseVariables = variablesToProcess.map(item => ({
          path: item.path,
          variableName: item.variable
        }));
        

        

        for (let index = 0; index < responseVariables.length; index++) {
          const extractor = responseVariables[index];

          
          if (extractor && extractor.path && extractor.variableName) {
            const parts = extractor.path.split(".");
            let valueToSave = res.data;
            


            let currentPath = '';
            let pathValid = true;
            
            for (let part of parts) {
              currentPath = currentPath ? `${currentPath}.${part}` : part;
  
              
              if (valueToSave && typeof valueToSave === 'object' && part in valueToSave) {
                valueToSave = valueToSave[part];

              } else {

                pathValid = false;
                break;
              }
            }
            
            if (pathValid && valueToSave !== undefined && valueToSave !== null) {

              data[extractor.variableName] = valueToSave;
              

              if (window.setFlowVariable) {
                window.setFlowVariable(extractor.variableName, valueToSave);

                
                const event = new CustomEvent('flowVariableUpdate', { 
                  detail: { name: extractor.variableName, value: valueToSave } 
                });
                window.dispatchEvent(event);
              } else {

                if (!window.flowVariables) window.flowVariables = {};
                window.flowVariables[extractor.variableName] = valueToSave;

                
                const event = new CustomEvent('flowVariableUpdate', { 
                  detail: { name: extractor.variableName, value: valueToSave } 
                });
                window.dispatchEvent(event);
              }
            } else {

            }
          } else {

          }
        }
        

        

        data.responseVariables = responseVariables;
        data.saveVariables = variablesToProcess;
        

        updateNodeData();
        

      }
    } catch (error) {
      setResponse(error.response ? error.response.data : "Erro na requisição");
      
      if (window.setFlowVariable) {
        window.setFlowVariable('apiError', error.response ? error.response.data : error.message);
      }
    }
  }, [
    url,
    buildUrlWithParams,
    method,
    requestBody,
    customHeaders,
    hasBody,
    saveVariables,
    timeout,
    data,
  ]);

  return (
    <Box
      sx={{
        backgroundColor: "#fff",
        borderRadius: 2,
        boxShadow: 2,
        p: 3,
        width: 320,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        position: "relative",
      }}
    >

      <Handle
        type="target"
        position="left"
        id="httpRequest-in"
        style={{
          left: -8,
          top: "50%",
          transform: "translateY(-50%)",
          background: "#555",
          width: 12,
          height: 12,
        }}
      />

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <HttpIcon fontSize="small" sx={{ color: '#1976d2' }} />
          <Typography variant="subtitle1" fontWeight="bold">
            Requisição HTTP
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


      <TextField
        label="URL"
        variant="outlined"
        size="small"
        value={url}
        onChange={(e) => {
          setUrl(e.target.value);
          data.url = e.target.value;
        }}
        fullWidth
      />


      <Autocomplete
        options={["GET", "POST", "PUT", "DELETE"]}
        value={method}
        onChange={(event, newValue) => {
          if (newValue) {
            setMethod(newValue);
            data.method = newValue;
          }
        }}
        renderInput={(params) => (
          <TextField {...params} label="Método" size="small" />
        )}
        clearOnEscape
      />
 <Button
        variant="text"
        size="small"
        onClick={() => setShowAdvanced(!showAdvanced)}
        sx={{ textTransform: "none", alignSelf: "flex-start" }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <SettingsIcon fontSize="small" />
          {showAdvanced ? "Ocultar avançado" : "Mostrar avançado"}
        </Box>
      </Button>

      {showAdvanced && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Typography variant="body2" fontWeight="bold">
            Parâmetros de Query
          </Typography>
          {queryParams.map((param, index) => (
            <Grid container spacing={1} key={index}>
              <Grid item xs={5}>
                <TextField
                  size="small"
                  label="Chave"
                  value={param.key}
                  onChange={(e) =>
                    updateQueryParam(index, "key", e.target.value)
                  }
                  fullWidth
                />
              </Grid>
              <Grid item xs={5}>
                <TextField
                  size="small"
                  label="Valor"
                  value={param.value}
                  onChange={(e) =>
                    updateQueryParam(index, "value", e.target.value)
                  }
                  fullWidth
                />
              </Grid>
              <Grid item xs={2} sx={{ display: "flex", alignItems: "center" }}>
                <IconButton size="small" onClick={() => removeQueryParam(index)}>
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Grid>
            </Grid>
          ))}
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddCircleOutlineIcon />}
            onClick={addQueryParam}
            sx={{ textTransform: "none", width: "100%" }}
          >
            Adicionar Parâmetro
          </Button>

          <Typography variant="body2" fontWeight="bold" mt={1}>
            Cabeçalhos (JSON)
          </Typography>
          <TextField
            variant="outlined"
            size="small"
            multiline
            minRows={2}
            value={headersString}
            onChange={(e) => setHeadersString(e.target.value)}
            placeholder='{"Authorization": "Bearer token", "Custom-Header": "XYZ"}'
            fullWidth
          />

          {hasBody && (
            <>
              <Typography variant="body2" fontWeight="bold" mt={1}>
                Corpo da requisição (JSON)
              </Typography>
              <Box sx={{ position: 'relative' }}>
                <AceEditor
                  mode="json"
                  theme="github"
                  name="requestBodyEditor"
                  fontSize={12}
                  showPrintMargin={false}
                  showGutter
                  highlightActiveLine
                  width="100%"
                  height="100px"
                  value={requestBody}
                  onChange={(value) => setRequestBody(value)}
                  setOptions={{ useWorker: false, tabSize: 2 }}
                  style={{ borderRadius: 4, border: "1px solid #ddd" }}
                />
                <IconButton 
                  size="small" 
                  onClick={() => setShowFullEditor(true)}
                  sx={{ 
                    position: 'absolute', 
                    right: 5, 
                    top: 5, 
                    bgcolor: 'rgba(255,255,255,0.8)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } 
                  }}
                >
                  <OpenInFullIcon fontSize="small" />
                </IconButton>
              </Box>
              
              <Dialog 
                open={showFullEditor} 
                onClose={() => setShowFullEditor(false)} 
                maxWidth="md" 
                fullWidth
              >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">Editar corpo da requisição</Typography>
                  <IconButton onClick={() => setShowFullEditor(false)}>
                    <CloseIcon />
                  </IconButton>
                </DialogTitle>
                <DialogContent>
                  <AceEditor
                    mode="json"
                    theme="github"
                    name="requestBodyEditorFull"
                    fontSize={14}
                    showPrintMargin={false}
                    showGutter
                    highlightActiveLine
                    width="100%"
                    height="400px"
                    value={requestBody}
                    onChange={(value) => setRequestBody(value)}
                    setOptions={{ useWorker: false, tabSize: 2 }}
                    style={{ borderRadius: 4, border: "1px solid #ddd" }}
                  />
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setShowFullEditor(false)} color="primary">
                    Fechar
                  </Button>
                </DialogActions>
              </Dialog>
            </>
          )}
          
          <Typography variant="body2" fontWeight="bold" mt={1}>
            Timeout (segundos)
          </Typography>
          <TextField
            variant="outlined"
            size="small"
            type="number"
            value={timeout / 1000}
            onChange={(e) => {
              const seconds = Math.min(Math.max(1, Number(e.target.value)), 45);
              setTimeout(seconds * 1000);
            }}
            inputProps={{ min: 1, max: 45 }}
            helperText="Tempo máximo de espera (1-45 segundos)"
            fullWidth
          />
        </Box>
      )}
      <Box sx={{ display: "flex", gap: 1 }}>
        <Button
          variant="contained"
          size="small"
          startIcon={<PlayArrowIcon />}
          onClick={() => {
            updateNodeData();
            testRequest();
          }}
          sx={{ 
            textTransform: "none", 
            flex: 1, 
            backgroundColor: "#2e7d32",
            boxShadow: 2,
            '&:hover': {
              backgroundColor: "#1b5e20"
            } 
          }}
        >
          Testar
        </Button>
        
        <Button
          variant="contained"
          color="primary"
          size="small"
          startIcon={<SaveAltIcon />}
          onClick={() => {
            updateNodeData();

           
            setSavedStatus('Salvo!');
            setShowSavePopup(true);
          }}
          sx={{ 
            textTransform: "none", 
            flex: 1,
            boxShadow: 2 
          }}
        >
          Salvar
        </Button>
      </Box>
      

      {showSavePopup && (
        <Box
          sx={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            backgroundColor: '#4caf50',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '4px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            zIndex: 1000,
            animation: 'fadeIn 0.3s ease-in-out',
            '@keyframes fadeIn': {
              '0%': { opacity: 0, transform: 'translateY(-10px)' },
              '100%': { opacity: 1, transform: 'translateY(0)' }
            }
          }}
        >
          <Typography variant="body2">
            Configuração salva com sucesso!
          </Typography>
        </Box>
      )}

      {response && (
        <Box
          sx={{
            borderRadius: 1,
            p: 1,
            backgroundColor: "#FAFAFA",
            maxHeight: 120,
            overflowY: "auto",
            position: 'relative'
          }}
        >
          <ReactJson
            src={response}
            name={false}
            collapsed={false}
            enableClipboard={false}
            displayDataTypes={false}
            displayObjectSize={false}
            theme="rjv-default"
            style={{ fontSize: 12 }}
          />
          <IconButton 
            size="small" 
            onClick={() => setShowFullResponse(true)}
            sx={{ 
              position: 'absolute', 
              right: 5, 
              top: 5, 
              bgcolor: 'rgba(255,255,255,0.8)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } 
            }}
          >
            <OpenInFullIcon fontSize="small" />
          </IconButton>
          
          <Dialog 
            open={showFullResponse} 
            onClose={() => setShowFullResponse(false)} 
            maxWidth="md" 
            fullWidth
          >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Resposta da API</Typography>
              <IconButton onClick={() => setShowFullResponse(false)}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <ReactJson
                  src={response}
                  name={false}
                  collapsed={1}
                  enableClipboard={true}
                  displayDataTypes={true}
                  displayObjectSize={true}
                  theme="rjv-default"
                  style={{ fontSize: 14 }}
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowFullResponse(false)} color="primary">
                Fechar
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      )}

     

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <Button
          variant="text"
          size="small"
          onClick={() => setShowMapping(!showMapping)}
          sx={{ textTransform: "none" }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <LinearScaleIcon fontSize="small" />
          {showMapping ? "Ocultar variáveis" : "Mapear variáveis"}
        </Box>
        </Button>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {savedStatus && (
            <Typography variant="caption" color="success.main">
              {savedStatus}
            </Typography>
          )}
          
          {saveVariables && saveVariables.length > 0 && (
            <Typography variant="caption" color="primary">
              {saveVariables.length} variável(is) configurada(s)
            </Typography>
          )}
        </Box>
      </Box>
      {showMapping && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Typography variant="body2" color="text.secondary" mb={1}>
            Defina caminhos na resposta da API para salvar em variáveis globais.
            As variáveis ficarão disponíveis para uso em outros nós.
          </Typography>
          
          {saveVariables.map((item, index) => (
            <Box 
              sx={{ 
                mb: 2,
                p: 3, 
                borderRadius: 2,
                bgcolor: 'rgba(25, 118, 210, 0.04)',
                border: '1px solid rgba(25, 118, 210, 0.08)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  bgcolor: 'rgba(25, 118, 210, 0.06)'
                }
              }} 
              key={index}
            >
              <Grid container spacing={2} sx={{ mb: 1.5 }}>
                <Grid item xs={11}>
                  <Autocomplete
                    freeSolo
                    options={jsonPaths}
                    value={item.path}
                    onChange={(e, newVal) =>
                      updateSaveVariable(index, "path", newVal)
                    }
                    onInputChange={(e, newVal) =>
                      updateSaveVariable(index, "path", newVal)
                    }
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        label="Caminho na resposta" 
                        size="small"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 1.5,
                            '&:hover fieldset': {
                              borderColor: 'primary.main',
                            },
                          },
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={1} sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <IconButton
                    size="small"
                    onClick={() => removeSaveVariable(index)}
                    sx={{
                      color: 'error.light',
                      '&:hover': {
                        color: 'error.main',
                        bgcolor: 'rgba(211, 47, 47, 0.04)'
                      }
                    }}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Grid>
              </Grid>
              <TextField
                label="Nome da variável global"
                variant="outlined"
                size="small"
                value={item.variable}
                onChange={(e) =>
                  updateSaveVariable(index, "variable", e.target.value)
                }
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                    '&:hover fieldset': {
                      borderColor: 'secondary.main',
                    },
                  },
                }}
              />
              {index > 0 && (
                <Box 
                  sx={{ 
                    width: '100%', 
                    display: 'flex', 
                    justifyContent: 'center', 
                    mt: -2.5, 
                    mb: -1.5 
                  }}
                >
                  <Box 
                    sx={{ 
                      width: '80%', 
                      borderTop: '1px dashed rgba(0,0,0,0.1)',
                      mt: 1 
                    }}
                  />
                </Box>
              )}
            </Box>
          ))}
          <Button
            variant="contained"
            size="small"
            color="secondary"
            startIcon={<AddCircleOutlineIcon />}
            onClick={addSaveVariable}
            sx={{ 
              textTransform: "none", 
              width: "100%",
              bgcolor: "#673ab7",
              '&:hover': {
                bgcolor: "#5e35b1",
                boxShadow: '0 4px 8px rgba(103, 58, 183, 0.3)'
              },
              boxShadow: '0 2px 4px rgba(103, 58, 183, 0.2)',
              borderRadius: 2,
              py: 1,
              mb: 2,
              fontSize: '0.9rem',
              fontWeight: 500,
              letterSpacing: '0.2px'
            }}
          >
            Adicionar variável
          </Button>
          
          <Box 
            sx={{ 
              display: "flex", 
              alignItems: "flex-start", 
              gap: 1.5, 
              mt: 2,
              p: 2,
              borderRadius: 2,
              bgcolor: 'rgba(255, 193, 7, 0.08)',
              border: '1px solid rgba(255, 193, 7, 0.2)',
              transition: 'all 0.2s ease',
              '&:hover': {
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                bgcolor: 'rgba(255, 193, 7, 0.1)'
              }
            }}>
            <TipsAndUpdatesIcon fontSize="small" sx={{ color: '#f57c00', mt: 0.3 }} />
            <Box>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'text.primary',
                  fontWeight: 500,
                  fontSize: '0.8rem',
                  display: 'block',
                  mb: 0.5
                }}
              >
                Dicas úteis:
              </Typography>
              
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ display: 'block', mb: 1, lineHeight: 1.4 }}
              >
                • A resposta completa da API é salva automaticamente na variável global <strong>apiResponse</strong>
              </Typography>
              
              <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                Você pode usar ${"{nomeDaVariavel}"} no URL e corpo da requisição para incluir valores de variáveis.
              </Typography>
            </Box>
          </Box>
        </Box>
      )}


      <Handle
        type="source"
        position="right"
        id="httpRequest-out"
        style={{
          right: -8,
          top: "50%",
          transform: "translateY(-50%)",
          background: "#555",
          width: 12,
          height: 12,
        }}
      />
    </Box>
  );
});

export default HttpRequestNode;