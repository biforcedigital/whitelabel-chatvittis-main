import React, { memo } from "react";
import {
  Box,
  Typography,
  IconButton,
  Divider,
  Chip
} from "@mui/material";
import {
  DynamicFeed,
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
        border: "1px solid rgba(104, 58, 200, 0.1)"
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
          <DynamicFeed fontSize="small" sx={{ color: '#683AC8' }} />
          <Typography variant="subtitle1" fontWeight="bold">
            Menu
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
        p: 1.5, 
        bgcolor: '#f5f5f5', 
        borderRadius: 1, 
        minHeight: '60px',
        overflow: 'auto',
        maxHeight: '80px',
        wordBreak: 'break-word'
      }}>
        <Typography variant="body2">
          {data.message}
        </Typography>
      </Box>
      
      <Divider sx={{ my: 1 }} />
      
      <Typography variant="caption" fontWeight="bold" color="text.secondary">
        Opções disponíveis:
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {data.arrayOption.map((option, index) => (
          <Box key={index} sx={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Chip 
              label={`[${option.number}] ${option.value}`} 
              variant="outlined" 
              size="small"
              sx={{ 
                bgcolor: '#f9f4ff',
                borderColor: '#683AC8',
                color: '#555',
                maxWidth: '220px',
                '& .MuiChip-label': {
                  whiteSpace: 'normal',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }
              }}
            />
            <Handle
              type="source"
              position="right"
              id={"a" + option.number}
              style={{
                right: -8,
                top: '50%',
                transform: 'translateY(-50%)',
                background: "#555",
                width: 12,
                height: 12,
                cursor: 'pointer'
              }}
              isConnectable={isConnectable}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
});