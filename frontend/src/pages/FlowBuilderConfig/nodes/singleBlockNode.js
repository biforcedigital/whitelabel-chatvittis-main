import React, { memo } from "react";
import {
  Box,
  Typography,
  IconButton,
  Paper,
  Divider,
  Stack
} from "@mui/material";
import {
  AccessTime,
  LibraryBooks,
  Message as MessageIcon,
  Image as ImageIcon,
  MicNone as MicNoneIcon,
  Videocam as VideocamIcon,
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
        border: "1px solid rgba(244, 67, 54, 0.2)"
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
          <LibraryBooks fontSize="small" sx={{ color: '#f44336' }} />
          <Typography variant="subtitle1" fontWeight="bold">
            Conteúdo
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
        bgcolor: '#ffebee', 
        p: 1.5, 
        borderRadius: 1,
        border: '1px solid rgba(244, 67, 54, 0.1)',
        maxHeight: 200,
        overflow: 'auto'
      }}>
        <Typography variant="body2" color="text.secondary" fontSize={12} mb={1}>
          Sequência de conteúdos ({data.seq.length} {data.seq.length === 1 ? 'item' : 'itens'}):
        </Typography>
        
        <Stack spacing={1}>
        {data.seq.map((item, index) => {
          const element = data.elements.find(el => el.number === item);
          return (
            <Paper 
              key={index}
              elevation={0} 
              sx={{
                bgcolor: '#fff',
                p: 1,
                border: '1px solid rgba(244, 67, 54, 0.1)',
                borderRadius: 1
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {item.includes("message") && (
                  <>
                    <MessageIcon fontSize="small" sx={{ color: '#f44336' }} />
                    <Typography variant="body2" noWrap title={element.value}>
                      {element.value.length > 28 ? `${element.value.substring(0, 28)}...` : element.value}
                    </Typography>
                  </>
                )}
                
                {item.includes("interval") && (
                  <>
                    <AccessTime fontSize="small" sx={{ color: '#f44336' }} />
                    <Typography variant="body2">
                      {element.value} segundos
                    </Typography>
                  </>
                )}
                
                {item.includes("img") && (
                  <>
                    <ImageIcon fontSize="small" sx={{ color: '#f44336' }} />
                    <Typography variant="body2" noWrap title={element.original}>
                      {element.original.length > 28 ? `${element.original.substring(0, 28)}...` : element.original}
                    </Typography>
                  </>
                )}
                
                {item.includes("audio") && (
                  <>
                    <MicNoneIcon fontSize="small" sx={{ color: '#f44336' }} />
                    <Typography variant="body2" noWrap title={element.original}>
                      {element.original.length > 28 ? `${element.original.substring(0, 28)}...` : element.original}
                    </Typography>
                  </>
                )}
                
                {item.includes("video") && (
                  <>
                    <VideocamIcon fontSize="small" sx={{ color: '#f44336' }} />
                    <Typography variant="body2" noWrap title={element.original}>
                      {element.original.length > 28 ? `${element.original.substring(0, 28)}...` : element.original}
                    </Typography>
                  </>
                )}
                
                {item.includes("pdf") && (
                  <>
                    <LibraryBooks fontSize="small" sx={{ color: '#f44336' }} />
                    <Typography variant="body2" noWrap title={element.original}>
                      {element.original.length > 28 ? `${element.original.substring(0, 28)}...` : element.original}
                    </Typography>
                  </>
                )}
              </Box>
            </Paper>
          );
        })}
        </Stack>
      </Paper>
      
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