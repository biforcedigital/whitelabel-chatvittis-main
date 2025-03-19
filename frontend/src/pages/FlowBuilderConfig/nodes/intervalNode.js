import React, { memo } from "react";
import {
  Box,
  Typography,
  IconButton,
  Chip
} from "@mui/material";
import {
  AccessTime,
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
        width: 280,
        display: "flex",
        flexDirection: "column",
        gap: 1,
        position: "relative",
        border: "1px solid rgba(247, 149, 59, 0.1)"
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
          <AccessTime fontSize="small" sx={{ color: '#F7953B' }} />
          <Typography variant="subtitle1" fontWeight="bold">
            Intervalo
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

      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        mt: 1,
        mb: 1
      }}>
        <Chip 
          label={`${data.sec} segundos`}
          variant="outlined"
          color="warning"
          icon={<AccessTime fontSize="small" />}
          sx={{ 
            borderColor: '#F7953B',
            bgcolor: '#fff9f0',
            fontWeight: 'medium', 
            fontSize: '0.95rem',
            py: 2
          }} 
        />
      </Box>
      
      <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 1 }}>
        O fluxo será pausado pelo tempo definido
      </Typography>
      
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