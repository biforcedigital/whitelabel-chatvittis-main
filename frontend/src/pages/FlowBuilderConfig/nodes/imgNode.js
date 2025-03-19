import React, { memo } from "react";
import {
  Box,
  Typography,
  IconButton
} from "@mui/material";
import {
  Image,
  ContentCopy as ContentCopyIcon,
  DeleteOutline as DeleteOutlineIcon
} from "@mui/icons-material";

import { Handle } from "react-flow-renderer";
import { useNodeStorage } from "../../../stores/useNodeStorage";

export default memo(({ data, isConnectable, id }) => {

  const link = process.env.REACT_APP_BACKEND_URL === 'http://localhost:8090' ? 'http://localhost:8090' : process.env.REACT_APP_BACKEND_URL

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
        border: "1px solid rgba(76, 175, 80, 0.1)"
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

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Image fontSize="small" sx={{ color: '#4caf50' }} />
          <Typography variant="subtitle1" fontWeight="bold">
            Imagem
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
        mt: 1, 
        borderRadius: 1,
        overflow: 'hidden',
        boxShadow: 1,
        textAlign: 'center'
      }}>
        <img 
          src={`${link}/public/${data.url}`} 
          alt="Imagem" 
          style={{ 
            maxWidth: '100%', 
            maxHeight: '200px', 
            objectFit: 'contain',
            display: 'block',
            margin: '0 auto'
          }} 
        />
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