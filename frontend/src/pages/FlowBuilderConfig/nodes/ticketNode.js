import React, { memo } from "react";
import {
  Box,
  Typography,
  IconButton,
  Paper
} from "@mui/material";
import {
  ConfirmationNumber as ConfirmationNumberIcon,
  ContentCopy as ContentCopyIcon,
  DeleteOutline as DeleteOutlineIcon
} from "@mui/icons-material";

import { useNodeStorage } from "../../../stores/useNodeStorage";
import { Handle } from "react-flow-renderer";

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
        border: "1px solid rgba(33, 150, 243, 0.2)"
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
          <ConfirmationNumberIcon fontSize="small" sx={{ color: '#2196f3' }} />
          <Typography variant="subtitle1" fontWeight="bold">
            Ticket
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
        bgcolor: '#e3f2fd', 
        p: 1.5, 
        borderRadius: 1,
        border: '1px solid rgba(33, 150, 243, 0.2)'
      }}>
        <Typography variant="body2" color="text.secondary" fontWeight="medium" textAlign="center">
          {Object.keys(data)[0] === "data" ? data.data.name : data.name}
        </Typography>
      </Paper>
      
      <Box sx={{ 
        mt: 1, 
        p: 1, 
        borderRadius: 1,
        bgcolor: 'rgba(33, 150, 243, 0.05)',
        textAlign: 'center'
      }}>
        <Typography variant="body2" color="primary.main">
          Transferência para um atendente humano
        </Typography>
      </Box>
      
      <Handle
        type="source"
        position="right"
        id="a"
        style={{
          right: -8,
          top: "50%",
          transform: "translateY(-50%)",
          background: "#2196f3",
          width: 12,
          height: 12,
          cursor: 'pointer'
        }}
        isConnectable={isConnectable}
      />
    </Box>
  );
});