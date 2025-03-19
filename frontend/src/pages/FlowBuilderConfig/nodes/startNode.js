import React, { memo } from "react";
import {
  Box,
  Typography,
  Paper
} from "@mui/material";
import {
  RocketLaunchOutlined as RocketLaunchIcon
} from "@mui/icons-material";

import { Handle } from "react-flow-renderer";

export default memo(({ data, isConnectable }) => {
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
        border: "1px solid rgba(76, 175, 80, 0.3)"
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <RocketLaunchIcon fontSize="small" sx={{ color: '#4caf50' }} />
        <Typography variant="subtitle1" fontWeight="bold">
          Início do fluxo
        </Typography>
      </Box>
      
      <Paper elevation={0} sx={{ 
        bgcolor: '#f1f8e9', 
        p: 1.5, 
        borderRadius: 1,
        border: '1px solid rgba(76, 175, 80, 0.2)' 
      }}>
        <Typography variant="body2" color="text.secondary">
          Este bloco marca o início do seu fluxo!
        </Typography>
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