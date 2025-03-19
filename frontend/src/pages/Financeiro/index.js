import React, { useState, useEffect, useReducer, useContext } from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from "@material-ui/core";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";
import SubscriptionModal from "../../components/SubscriptionModal";
import api from "../../services/api";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import moment from "moment";
import ForbiddenPage from "../../components/ForbiddenPage";

const useStyles = makeStyles(theme => ({
  mainPaper: {
    flex: 1,
    padding: 0,
    borderRadius: 0,
    boxShadow: "none",
    backgroundColor: "#f5f5f5",
    ...theme.scrollbarStyles,
  },
  searchContainer: {
    backgroundColor: "white",
    padding: theme.spacing(2),
    borderRadius: theme.spacing(1),
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  tableContainer: {
    backgroundColor: "white",
    borderRadius: theme.spacing(1),
    padding: theme.spacing(2),
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
  },
  customTable: {
    "& .MuiTableCell-head": {
      fontWeight: 600,
      color: "#171717",
      borderBottom: "2px solid #f5f5f5",
    },
    "& .MuiTableCell-body": {
      borderBottom: "1px solid #f5f5f5",
    },
    "& .MuiTableRow-root:hover": {
      backgroundColor: "#f9f9f9",
    },
  },
  actionButton: {
    borderRadius: 8,
  },
  payButton: {
    borderColor: "#08c2c2",
    color: "#08c2c2",
    "&:hover": {
      borderColor: "#07b0b0",
      backgroundColor: "rgba(37, 182, 232, 0.05)",
    },
  },
  paidButton: {
    borderColor: "#4caf50",
    color: "#4caf50",
    cursor: "default",
    "&:hover": {
      backgroundColor: "transparent",
    },
  },
  valueText: {
    fontWeight: 500,
    color: "#171717",
  },
  dateText: {
    color: "#666",
  },
}));

const reducer = (state, action) => {
  if (action.type === "LOAD_INVOICES") {
    const invoices = action.payload;
    const newUsers = [];

    invoices.forEach((user) => {
      const userIndex = state.findIndex((u) => u.id === user.id);
      if (userIndex !== -1) {
        state[userIndex] = user;
      } else {
        newUsers.push(user);
      }
    });

    return [...state, ...newUsers];
  }

  if (action.type === "UPDATE_USERS") {
    const user = action.payload;
    const userIndex = state.findIndex((u) => u.id === user.id);

    if (userIndex !== -1) {
      state[userIndex] = user;
      return [...state];
    } else {
      return [user, ...state];
    }
  }

  if (action.type === "DELETE_USER") {
    const userId = action.payload;

    const userIndex = state.findIndex((u) => u.id === userId);
    if (userIndex !== -1) {
      state.splice(userIndex, 1);
    }
    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }
};
const Invoice = ({ invoice, onPayClick }) => {
  const classes = useStyles();

  const handlePayClick = () => {
    window.open(invoice.linkInvoice, "_blank");
  };

  return (
    <TableRow key={invoice.id}>
      <TableCell align="center">{invoice.detail}</TableCell>
      <TableCell align="center">{invoice.users}</TableCell>
      <TableCell align="center">{invoice.connections}</TableCell>
      <TableCell align="center" className={classes.dateText}>
        {moment(invoice.dueDate).format("DD/MM/YYYY")}
      </TableCell>
      <TableCell align="center" className={classes.valueText}>
        {invoice.value ? invoice.value.toLocaleString("pt-br", {
          style: "currency",
          currency: "BRL",
        }) : 'N/A'}
      </TableCell>
      <TableCell align="center">
        {invoice.status !== "Pago" ? (
          <Button
            size="small"
            variant="outlined"
            onClick={handlePayClick}
            className={`${classes.actionButton} ${classes.payButton}`}
          >
            PAGAR
          </Button>
        ) : (
          <Button
            size="small"
            variant="outlined"
            className={`${classes.actionButton} ${classes.paidButton}`}
            disabled
          >
            PAGO
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
};

const Invoices = () => {
  const classes = useStyles();
  const { user } = useContext(AuthContext);

  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [invoices, dispatch] = useReducer(reducer, []);
  const [storagePlans, setStoragePlans] = React.useState([]);
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);

  const handleOpenContactModal = (invoices) => {
    setStoragePlans(invoices);
    setSelectedContactId(null);
    setContactModalOpen(true);
  };

  const handleCloseContactModal = () => {
    setSelectedContactId(null);
    setContactModalOpen(false);
  };

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam]);

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      const fetchInvoices = async () => {
        try {
          const { data } = await api.get("/invoices", {
            params: { searchParam, pageNumber },
          });
          dispatch({ type: "LOAD_INVOICES", payload: data.invoices });
          setHasMore(data.hasMore);
          setLoading(false);
        } catch (err) {
          toastError(err);
        }
      };
      fetchInvoices();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchParam, pageNumber]);

  const loadMore = () => {
    setPageNumber((prevState) => prevState + 1);
  };

  const handleScroll = (e) => {
    if (!hasMore || loading) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - (scrollTop + 100) < clientHeight) {
      loadMore();
    }
  };

  return (
    <MainContainer>
      <SubscriptionModal
        open={contactModalOpen}
        onClose={handleCloseContactModal}
        aria-labelledby="form-dialog-title"
        Invoice={storagePlans}
        contactId={selectedContactId}
      />

      {user.profile === "user" ? (
        <ForbiddenPage />
      ) : (
        <>
          <div className={classes.searchContainer}>
            <div style={{
              display: "flex",
              gap: "16px",
              alignItems: "center"
            }}>
              <Typography variant="h6" style={{ color: '#171717' }}>
                Faturas ({invoices.length})
              </Typography>
            </div>
          </div>

          <Paper className={classes.mainPaper} onScroll={handleScroll}>
            <div className={classes.tableContainer}>
              <Table size="small" className={classes.customTable}>
                <TableHead>
                  <TableRow>
                    <TableCell align="center">Detalhes</TableCell>
                    <TableCell align="center">Usuários</TableCell>
                    <TableCell align="center">Conexões</TableCell>
                    <TableCell align="center">Vencimento</TableCell>
                    <TableCell align="center">Valor</TableCell>
                    <TableCell align="center">Ação</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoices.map((invoice) => (
                    <Invoice
                      key={invoice.id}
                      invoice={invoice}
                    />
                  ))}
                  {loading && <TableRowSkeleton columns={6} />}
                </TableBody>
              </Table>
            </div>
          </Paper>
        </>
      )}
    </MainContainer>
  );
};

export default Invoices;