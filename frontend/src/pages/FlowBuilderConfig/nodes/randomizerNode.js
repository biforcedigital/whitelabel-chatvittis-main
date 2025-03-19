import React, { memo } from "react";
import {
  Box,
  Typography,
  IconButton,
  Paper,
  Divider
} from "@mui/material";
import {
  CallSplit,
  ContentCopy as ContentCopyIcon,
  DeleteOutline as DeleteOutlineIcon
} from "@mui/icons-material";

import { Handle } from "react-flow-renderer";
import { useNodeStorage } from "../../../stores/useNodeStorage";

export default memo(({ data, isConnectable, id }) => {
  const storageItems = useNodeStorage();

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
        border: "1px solid rgba(3, 169, 244, 0.2)"
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
          <CallSplit fontSize="small" sx={{ color: '#03a9f4' }} />
          <Typography variant="subtitle1" fontWeight="bold">
            Randomizador
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
        bgcolor: '#e1f5fe', 
        p: 1.5, 
        borderRadius: 1,
        border: '1px solid rgba(3, 169, 244, 0.2)',
        textAlign: 'center'
      }}>
        <Typography variant="body2" fontWeight="medium" color="text.secondary">
          Direciona aleatoriamente baseado na porcentagem definida
        </Typography>
      </Paper>
      
      <Divider sx={{ my: 1 }} />
      
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        p: 1
      }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          position: 'relative',
          width: '45%'
        }}>
          <Typography variant="subtitle2" fontWeight="bold" color="primary.main">
            Opção A
          </Typography>
          <Typography variant="h6" fontWeight="bold" color="primary.main">
            {data.percent}%
          </Typography>
          <Handle
            type="source"
            position="right"
            id="a"
            style={{
              top: "50%",
              right: -130,
              background: "#03a9f4",
              width: 12,
              height: 12,
              cursor: 'pointer'
            }}
            isConnectable={isConnectable}
          />
        </Box>
        
        <Divider orientation="vertical" flexItem />
        
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          position: 'relative',
          width: '45%'
        }}>
          <Typography variant="subtitle2" fontWeight="bold" color="info.dark">
            Opção B
          </Typography>
          <Typography variant="h6" fontWeight="bold" color="info.dark">
            {100 - data.percent}%
          </Typography>
          <Handle
            type="source"
            position="right"
            id="b"
            style={{
              top: "50%",
              right: -8,
              background: "#0288d1",
              width: 12,
              height: 12,
              cursor: 'pointer'
            }}
            isConnectable={isConnectable}
          />
        </Box>
      </Box>
    </Box>
  );
});