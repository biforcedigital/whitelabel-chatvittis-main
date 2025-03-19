import React, { memo } from "react";
import {
  Box,
  Typography,
  Paper,
  Chip,
  Divider
} from "@mui/material";
import {
  ImportExport as ImportExportIcon,
  Check as CheckIcon,
  Close as CloseIcon
} from "@mui/icons-material";

import { Handle } from "react-flow-renderer";

export default memo(({ data, isConnectable }) => {
  const typeCondition = (value) => {
    if(value === 1){
      return '=='
    }
    if(value === 2){
      return '>='
    }
    if(value === 3){
      return '<='
    }
    if(value === 4){
      return '<'
    }
    if(value === 5){
      return '>'
    }
  }
  return (
    <Box
      sx={{
        backgroundColor: "#fff",
        borderRadius: 2,
        boxShadow: 2,
        p: 2,
        width: 250,
        display: "flex",
        flexDirection: "column",
        gap: 1,
        position: "relative",
        border: "1px solid rgba(63, 81, 181, 0.2)"
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
        onConnect={(params) => console.log("handle onConnect", params)}
        isConnectable={isConnectable}
      />

      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <ImportExportIcon fontSize="small" sx={{ color: '#3f51b5' }} />
        <Typography variant="subtitle1" fontWeight="bold">
          Condição
        </Typography>
      </Box>
      
      <Paper elevation={0} sx={{ 
        bgcolor: '#e8eaf6', 
        p: 1.5, 
        borderRadius: 1,
        border: '1px solid rgba(63, 81, 181, 0.2)' 
      }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="body2" fontWeight="medium">
            {data.key} {typeCondition(data.condition)} {data.value}
          </Typography>
        </Box>
      </Paper>
      
      <Divider sx={{ my: 1 }} />
      
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        px: 2 
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CheckIcon fontSize="small" sx={{ color: 'success.main', mr: 0.5 }} />
          <Typography variant="caption" fontWeight="bold" color="success.main">
            Verdadeiro
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CloseIcon fontSize="small" sx={{ color: 'error.main', mr: 0.5 }} />
          <Typography variant="caption" fontWeight="bold" color="error.main">
            Falso
          </Typography>
        </Box>
      </Box>
      
      <Handle
        type="source"
        position="right"
        id="a"
        style={{ 
          top: "30%", 
          right: -8,
          background: "#4caf50",
          width: 12,
          height: 12,
          cursor: 'pointer'
        }}
        isConnectable={isConnectable}
      />
      
      <Handle
        type="source"
        position="right"
        id="b"
        style={{ 
          bottom: "30%", 
          top: "auto", 
          right: -8,
          background: "#f44336",
          width: 12,
          height: 12,
          cursor: 'pointer'
        }}
        isConnectable={isConnectable}
      />
    </Box>
  );
});