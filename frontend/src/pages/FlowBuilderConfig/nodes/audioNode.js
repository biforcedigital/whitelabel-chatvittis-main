import React, { memo } from "react";
import {
  Box,
  Typography,
  IconButton,
  Chip
} from "@mui/material";
import {
  MicNone,
  ContentCopy as ContentCopyIcon,
  DeleteOutline as DeleteOutlineIcon
} from "@mui/icons-material";

import { Handle } from "react-flow-renderer";
import { useNodeStorage } from "../../../stores/useNodeStorage";

export default memo(({ data, isConnectable, id }) => {
  const link =
    process.env.REACT_APP_BACKEND_URL === "http://localhost:8090"
      ? "http://localhost:8090"
      : process.env.REACT_APP_BACKEND_URL;

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
        border: "1px solid rgba(99, 97, 97, 0.1)"
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
          <MicNone fontSize="small" sx={{ color: '#e53935' }} />
          <Typography variant="subtitle1" fontWeight="bold">
            Áudio
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

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
        <Chip 
          label={data.record ? "Gravado na hora" : "Áudio enviado"}
          variant="outlined" 
          color="error"
          size="small"
          icon={<MicNone fontSize="small" />}
          sx={{ mb: 1 }}
        />
      </Box>
      
      <Box sx={{ 
        mt: 1, 
        borderRadius: 1,
        padding: 1,
        bgcolor: '#f5f5f5',
        display: 'flex',
        justifyContent: 'center'
      }}>
        <audio controls style={{ width: '100%' }}>
          <source src={`${link}/public/${data.url}`} type="audio/mp3" />
          Seu navegador não suporta áudio HTML5
        </audio>
      </Box>
      
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