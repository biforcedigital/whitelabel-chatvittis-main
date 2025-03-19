import React, {
  useState,
  useEffect,
  useReducer,
  useContext,
  useRef,
} from "react";
import { toast } from "react-toastify";
import { useHistory } from "react-router-dom";
import { CSVLink } from "react-csv";
import { makeStyles } from "@material-ui/core/styles";
import PopupState, { bindTrigger, bindMenu } from "material-ui-popup-state";
import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Avatar,
  InputAdornment,
  Typography,
  Menu,
  MenuItem,
  Box,
  CircularProgress,
} from "@material-ui/core";
import { useTheme } from "@material-ui/core/styles";

import {
  AddCircleOutline,
  Search,
  Edit as EditIcon,
  DeleteOutline as DeleteOutlineIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  ArrowDropDown,
  Backup,
  ContactPhone,
  Facebook,
  Instagram,
  WhatsApp,
  CloudDownload,
  InfoOutlined,
} from "@material-ui/icons";

import { AuthContext } from "../../context/Auth/AuthContext";
import { TicketsContext } from "../../context/Tickets/TicketsContext";
import { i18n } from "../../translate/i18n";
import { Can } from "../../components/Can";
import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import ContactModal from "../../components/ContactModal";
import NewTicketModal from "../../components/NewTicketModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import ContactImportWpModal from "../../components/ContactImportWpModal";
import { TagsFilter } from "../../components/TagsFilter";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import formatSerializedId from "../../utils/formatSerializedId";
import useCompanySettings from "../../hooks/useSettings/companySettings";

const reducer = (state, action) => {
  if (action.type === "LOAD_CONTACTS") {
    const contacts = action.payload;
    const newContacts = [];

    contacts.forEach((contact) => {
      const contactIndex = state.findIndex((c) => c.id === contact.id);
      if (contactIndex !== -1) {
        state[contactIndex] = contact;
      } else {
        newContacts.push(contact);
      }
    });

    return [...state, ...newContacts];
  }

  if (action.type === "UPDATE_CONTACTS") {
    const contact = action.payload;
    const contactIndex = state.findIndex((c) => c.id === contact.id);

    if (contactIndex !== -1) {
      state[contactIndex] = contact;
      return [...state];
    } else {
      return [contact, ...state];
    }
  }

  if (action.type === "DELETE_CONTACT") {
    const contactId = action.payload;
    const contactIndex = state.findIndex((c) => c.id === contactId);
    if (contactIndex !== -1) {
      state.splice(contactIndex, 1);
    }
    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }
};

const useStyles = makeStyles((theme) => ({
  mainPaper: {
    flex: 1,
    padding: theme.spacing(1),
    overflowY: "scroll",
    borderRadius: 0,
    boxShadow: "none",
    backgroundColor: "#f5f5f5",
    ...theme.scrollbarStyles,
    height: "calc(100% - 48px)",
  },
  searchContainer: {
    backgroundColor: "white",
    padding: theme.spacing(1.5),
    borderRadius: theme.spacing(1),
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
    marginBottom: theme.spacing(2),
  },
  topControls: {
    display: "flex",
    alignItems: "flex-start",
    gap: theme.spacing(2),
    [theme.breakpoints.down("sm")]: {
      flexDirection: "column",
      gap: theme.spacing(1),
    },
  },
  searchAndButtons: {
    display: "flex",
    alignItems: "flex-start",
    gap: theme.spacing(2),
    flex: 2,
    [theme.breakpoints.down("sm")]: {
      flexDirection: "column",
      gap: theme.spacing(1),
      width: "100%",
    },
  },
  filterContainer: {
    flex: 1,
    minWidth: 200,
    [theme.breakpoints.down("sm")]: {
      width: "100%",
    },
  },
  searchInput: {
    flex: 2,
    minWidth: 200,
    maxWidth: "100%",
    "& .MuiOutlinedInput-root": {
      height: 42,
      borderRadius: 8,
      backgroundColor: "#f8f9fa",
      transition: "all 0.3s ease",
      fontSize: "0.9rem",
      [theme.breakpoints.down("sm")]: {
        height: 38,
      },
      "& fieldset": {
        borderColor: "rgba(0, 0, 0, 0.1)",
      },
      "&:hover": {
        backgroundColor: "#fff",
        "& fieldset": {
          borderColor: "#08c2c2",
        },
      },
      "&.Mui-focused": {
        backgroundColor: "#fff",
        "& fieldset": {
          borderColor: "#08c2c2",
          borderWidth: 1,
        },
      },
    },
    "& .MuiOutlinedInput-input": {
      padding: "0 14px",
      height: "100%",
      fontWeight: 500,
    },
    "& .MuiInputAdornment-root": {
      marginLeft: 8,
      marginRight: -4,
      height: "100%",
      maxHeight: "none",
    },
  },
  actionButtons: {
    display: "flex",
    gap: theme.spacing(1),
    [theme.breakpoints.down("sm")]: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      width: "100%",
    },
  },
  button: {
    borderRadius: 8,
    textTransform: "none",
    padding: "8px 16px",
    height: 42,
    fontWeight: "bold",
    fontSize: "0.9rem",
    boxShadow: "none",
    minWidth: 130,
    [theme.breakpoints.down("sm")]: {
      width: "100%",
      height: 38,
      padding: "8px 0",
      minWidth: "auto",
    },
    "&:hover": {
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    },
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing(4),
    "& .MuiCircularProgress-root": {
      color: "#08c2c2",
    },
  },
  tableContainer: {
    display: "none",
    [theme.breakpoints.up("md")]: {
      display: "block",
      backgroundColor: "white",
      borderRadius: theme.spacing(1),
      padding: theme.spacing(2),
      boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    },
  },
  mobileCardContainer: {
    display: "grid",
    gap: theme.spacing(1),
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    [theme.breakpoints.up("md")]: {
      display: "none",
    },
  },
  contactCard: {
    backgroundColor: "white",
    borderRadius: 8,
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
    },
  },
  cardContent: {
    padding: theme.spacing(2),
    [theme.breakpoints.down("sm")]: {
      padding: theme.spacing(1.5),
    },
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1.5),
    marginBottom: theme.spacing(1.5),
  },
  infoButton: {
    marginLeft: "auto",
    color: theme.palette.primary.main,
  },
  statusChip: {
    borderRadius: "6px",
    height: "24px",
    padding: "0 8px",
    fontSize: "0.75rem",
    fontWeight: 500,
  },
  activeChip: {
    backgroundColor: "#e3f2fd",
    color: "#1976d2",
  },
  inactiveChip: {
    backgroundColor: "#ffebee",
    color: "#d32f2f",
  },
  noResults: {
    textAlign: "center",
    padding: theme.spacing(4),
    color: theme.palette.text.secondary,
  },
  menu: {
    "& .MuiMenuItem-root": {
      minHeight: 48,
    },
  },
  menuIcon: {
    marginRight: theme.spacing(1),
    color: "#08c2c2",
  },
}));

const Contacts = () => {
  const classes = useStyles();
  const history = useHistory();
  const { user, socket } = useContext(AuthContext);
  const { setCurrentTicket } = useContext(TicketsContext);
  const { getAll: getAllSettings } = useCompanySettings();
  const theme = useTheme();
  // States
  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [searchParam, setSearchParam] = useState("");
  const [contacts, dispatch] = useReducer(reducer, []);
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [importContactModalOpen, setImportContactModalOpen] = useState(false);
  const [deletingContact, setDeletingContact] = useState(null);
  const [ImportContacts, setImportContacts] = useState(null);
  const [blockingContact, setBlockingContact] = useState(null);
  const [unBlockingContact, setUnBlockingContact] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [exportContact, setExportContact] = useState(false);
  const [confirmChatsOpen, setConfirmChatsOpen] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [newTicketModalOpen, setNewTicketModalOpen] = useState(false);
  const [contactTicket, setContactTicket] = useState({});
  const [selectedTags, setSelectedTags] = useState([]);
  const [hideNum, setHideNum] = useState(false);
  const [enableLGPD, setEnableLGPD] = useState(false);
  const [warningOpen, setWarningOpen] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const fileUploadRef = useRef(null);

  // Effects
  useEffect(() => {
    async function fetchData() {
      const settingList = await getAllSettings(user.companyId);
      for (const [key, value] of Object.entries(settingList)) {
        if (key === "enableLGPD") setEnableLGPD(value === "enabled");
        if (key === "lgpdHideNumber") setHideNum(value === "enabled");
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam, selectedTags]);

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      const fetchContacts = async () => {
        try {
          const { data } = await api.get("/contacts/", {
            params: {
              searchParam,
              pageNumber,
              contactTag: JSON.stringify(selectedTags),
            },
          });
          dispatch({ type: "LOAD_CONTACTS", payload: data.contacts });
          setHasMore(data.hasMore);
          setLoading(false);
        } catch (err) {
          toastError(err);
        }
      };
      fetchContacts();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchParam, pageNumber, selectedTags]);

  useEffect(() => {
    const companyId = user.companyId;
    const onContactEvent = (data) => {
      if (data.action === "update" || data.action === "create") {
        dispatch({ type: "UPDATE_CONTACTS", payload: data.contact });
      }
      if (data.action === "delete") {
        dispatch({ type: "DELETE_CONTACT", payload: +data.contactId });
      }
    };

    socket.on(`company-${companyId}-contact`, onContactEvent);
    return () => {
      socket.off(`company-${companyId}-contact`, onContactEvent);
    };
  }, [socket, user]);

  // Handlers
  const handleSelectedTags = (selecteds) => {
    const tags = selecteds.map((t) => t.id);
    setSelectedTags(tags);
  };

  const handleSearch = (event) => {
    setSearchParam(event.target.value.toLowerCase());
  };

  const handleOpenContactModal = () => {
    setSelectedContactId(null);
    setContactModalOpen(true);
  };

  const handleCloseContactModal = () => {
    setSelectedContactId(null);
    setContactModalOpen(false);
  };

  const hadleEditContact = (contactId) => {
    setSelectedContactId(contactId);
    setContactModalOpen(true);
  };

  const handleDeleteContact = async (contactId) => {
    try {
      await api.delete(`/contacts/${contactId}`);
      toast.success(i18n.t("contacts.toasts.deleted"));
    } catch (err) {
      toastError(err);
    }
    setDeletingContact(null);
    setSearchParam("");
    setPageNumber(1);
  };

  const handleBlockContact = async (contactId) => {
    try {
      await api.put(`/contacts/block/${contactId}`, { active: false });
      toast.success("Contato bloqueado");
    } catch (err) {
      toastError(err);
    }
    setDeletingContact(null);
    setSearchParam("");
    setPageNumber(1);
    setBlockingContact(null);
  };

  const handleUnBlockContact = async (contactId) => {
    try {
      await api.put(`/contacts/block/${contactId}`, { active: true });
      toast.success("Contato desbloqueado");
    } catch (err) {
      toastError(err);
    }
    setDeletingContact(null);
    setSearchParam("");
    setPageNumber(1);
    setUnBlockingContact(null);
  };

  const handleimportContact = async () => {
    try {
      await api.post("/contacts/import");
      history.go(0);
      setImportContacts(false);
    } catch (err) {
      toastError(err);
      setImportContacts(false);
    }
  };

  const handleImportExcel = async () => {
    try {
      const formData = new FormData();
      formData.append("file", fileUploadRef.current.files[0]);
      await api.request({
        url: `/contacts/upload`,
        method: "POST",
        data: formData,
      });
      history.go(0);
    } catch (err) {
      toastError(err);
    }
  };

  const handleScroll = (e) => {
    if (!hasMore || loading) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - (scrollTop + 100) < clientHeight) {
      loadMore();
    }
  };

  const loadMore = () => {
    setPageNumber((prevState) => prevState + 1);
  };

  const checkContactStatus = async (contact) => {
    try {
      const { data } = await api.get(`/contacts/${contact.id}/status`);
      if (data === "inQueue") {
        setWarningMessage(
          "Este contato já está sendo atendido por outro usuário."
        );
        setWarningOpen(true);
      } else if (data.includes("beingAttendedBy:")) {
        setWarningMessage(
          `Este contato está sendo atendido por ${data.split(":")[1]}`
        );
        setWarningOpen(true);
      } else {
        setContactTicket(contact);
        setNewTicketModalOpen(true);
      }
    } catch (err) {
      toastError(err);
    }
  };

  const handleSelectTicket = (ticket) => {
    const { id, uuid } = ticket;
    setCurrentTicket({ id, uuid, code: uuid });
  };

  const handleCloseOrOpenTicket = (ticket) => {
    setNewTicketModalOpen(false);
    if (ticket !== undefined && ticket.uuid !== undefined) {
      handleSelectTicket(ticket);
      history.push(`/tickets/${ticket.uuid}`);
    }
  };

  const handleOpenInfo = (contact) => {
    setSelectedContact(contact);
    setInfoDialogOpen(true);
  };

  return (
    <MainContainer>
      {/* Modais */}
      <NewTicketModal
        modalOpen={newTicketModalOpen}
        initialContact={contactTicket}
        onClose={handleCloseOrOpenTicket}
      />

      <ContactModal
        open={contactModalOpen}
        onClose={handleCloseContactModal}
        contactId={selectedContactId}
      />

      <ContactImportWpModal
        isOpen={importContactModalOpen}
        handleClose={() => setImportContactModalOpen(false)}
      />
      <ConfirmationModal
        title={
          deletingContact
            ? `${i18n.t("contacts.confirmationModal.deleteTitle")} ${
                deletingContact.name
              }?`
            : blockingContact
            ? `Bloquear Contato ${blockingContact.name}?`
            : unBlockingContact
            ? `Desbloquear Contato ${unBlockingContact.name}?`
            : ImportContacts
            ? `${i18n.t("contacts.confirmationModal.importTitlte")}`
            : `${i18n.t("contactListItems.confirmationModal.importTitlte")}`
        }
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() =>
          deletingContact
            ? handleDeleteContact(deletingContact.id)
            : blockingContact
            ? handleBlockContact(blockingContact.id)
            : unBlockingContact
            ? handleUnBlockContact(unBlockingContact.id)
            : ImportContacts
            ? handleimportContact()
            : handleImportExcel()
        }
      >
        {exportContact
          ? `${i18n.t("contacts.confirmationModal.exportContact")}`
          : deletingContact
          ? `${i18n.t("contacts.confirmationModal.deleteMessage")}`
          : blockingContact
          ? `${i18n.t("contacts.confirmationModal.blockContact")}`
          : unBlockingContact
          ? `${i18n.t("contacts.confirmationModal.unblockContact")}`
          : ImportContacts
          ? `${i18n.t("contacts.confirmationModal.importMessage")}`
          : `${i18n.t("contactListItems.confirmationModal.importMessage")}`}
      </ConfirmationModal>

      <Dialog open={warningOpen} onClose={() => setWarningOpen(false)}>
        <DialogTitle>Aviso</DialogTitle>
        <DialogContent>{warningMessage}</DialogContent>
        <DialogActions>
          <Button onClick={() => setWarningOpen(false)} color="primary">
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={infoDialogOpen}
        onClose={() => setInfoDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Informações Detalhadas</DialogTitle>
        <DialogContent>
          {selectedContact && (
            <div style={{ padding: "16px" }}>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Nome:</strong> {selectedContact.name}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>WhatsApp:</strong>{" "}
                {formatSerializedId(selectedContact?.number)}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Email:</strong> {selectedContact.email}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Canal:</strong> {selectedContact?.whatsapp?.name}
              </Typography>
              <Typography variant="body2">
                <strong>Status:</strong>{" "}
                {selectedContact.active ? "Ativo" : "Inativo"}
              </Typography>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInfoDialogOpen(false)} color="primary">
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Conteúdo Principal */}
      <div className={classes.searchContainer}>
        <div className={classes.topControls}>
          <div className={classes.searchAndButtons}>
            <TextField
              className={classes.searchInput}
              placeholder={i18n.t("contacts.searchPlaceholder")}
              type="search"
              value={searchParam}
              onChange={handleSearch}
              variant="outlined"
              size="small"
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search style={{ color: "#08c2c2", fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
            />
            <div className={classes.filterContainer}>
              <TagsFilter onFiltered={handleSelectedTags} />
            </div>
          </div>
          <div className={classes.actionButtons}>
            <PopupState variant="popover" popupId="import-menu">
              {(popupState) => (
                <React.Fragment>
                  <Button
                    variant="contained"
                    {...bindTrigger(popupState)}
                    className={classes.button}
                    startIcon={<ArrowDropDown style={{ fontSize: 20 }} />}
                    style={{ backgroundColor: "#08c2c2", color: "white" }}
                  >
                    Importar
                  </Button>
                  <Menu
                    {...bindMenu(popupState)}
                    className={classes.menu}
                    anchorOrigin={{
                      vertical: "bottom",
                      horizontal: "right",
                    }}
                    transformOrigin={{
                      vertical: "top",
                      horizontal: "right",
                    }}
                  >
                    <MenuItem
                      onClick={() => {
                        setConfirmOpen(true);
                        setImportContacts(true);
                        popupState.close();
                      }}
                    >
                      <ContactPhone className={classes.menuIcon} />
                      {i18n.t("contacts.menu.importYourPhone")}
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        setImportContactModalOpen(true);
                        popupState.close();
                      }}
                    >
                      <Backup className={classes.menuIcon} />
                      {i18n.t("contacts.menu.importToExcel")}
                    </MenuItem>
                  </Menu>
                </React.Fragment>
              )}
            </PopupState>

            <Button
              variant="contained"
              onClick={handleOpenContactModal}
              className={classes.button}
              startIcon={<AddCircleOutline style={{ fontSize: 20 }} />}
              style={{ backgroundColor: "#08c2c2", color: "white" }}
            >
              Adicionar
            </Button>
          </div>
        </div>
      </div>

      <Paper className={classes.mainPaper} onScroll={handleScroll}>
        {/* Desktop Table View */}
        <div className={classes.tableContainer}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell></TableCell>
                <TableCell>{i18n.t("contacts.table.name")}</TableCell>
                <TableCell>{i18n.t("contacts.table.whatsapp")}</TableCell>
                <TableCell>{i18n.t("contacts.table.email")}</TableCell>
                <TableCell align="center">
                  {i18n.t("contacts.table.whatsapp")}
                </TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="right">
                  {i18n.t("contacts.table.actions")}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell>
                    <Avatar src={contact?.urlPicture} alt={contact.name} />
                  </TableCell>
                  <TableCell>{contact.name}</TableCell>
                  <TableCell>
                    {enableLGPD && hideNum && user.profile === "user"
                      ? contact.isGroup
                        ? contact.number
                        : formatSerializedId(contact?.number) === null
                        ? contact.number.slice(0, -6) +
                          "**-**" +
                          contact?.number.slice(-2)
                        : formatSerializedId(contact?.number)?.slice(0, -6) +
                          "**-**" +
                          contact?.number?.slice(-2)
                      : contact.isGroup
                      ? contact.number
                      : formatSerializedId(contact?.number)}
                  </TableCell>
                  <TableCell>{contact.email}</TableCell>
                  <TableCell align="center">
                    {contact?.whatsapp?.name}
                  </TableCell>
                  <TableCell align="center">
                    {contact.active ? (
                      <CheckCircleIcon style={{ color: "#4CAF50" }} />
                    ) : (
                      <CancelIcon style={{ color: "#E57373" }} />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      disabled={!contact.active}
                      onClick={() => checkContactStatus(contact)}
                    >
                      {contact.channel === "whatsapp" && (
                        <WhatsApp style={{ color: "#25d366" }} />
                      )}
                      {contact.channel === "instagram" && (
                        <Instagram style={{ color: "#e1306c" }} />
                      )}
                      {contact.channel === "facebook" && (
                        <Facebook style={{ color: "#3b5998" }} />
                      )}
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => hadleEditContact(contact.id)}
                    >
                      <EditIcon style={{ color: "#08c2c2" }} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => {
                        if (contact.active) {
                          setConfirmOpen(true);
                          setBlockingContact(contact);
                        } else {
                          setConfirmOpen(true);
                          setUnBlockingContact(contact);
                        }
                      }}
                    >
                      {contact.active ? (
                        <BlockIcon style={{ color: "#E57373" }} />
                      ) : (
                        <CheckCircleIcon style={{ color: "#4CAF50" }} />
                      )}
                    </IconButton>
                    <Can
                      role={user.profile}
                      perform="contacts-page:deleteContact"
                      yes={() => (
                        <IconButton
                          size="small"
                          onClick={() => {
                            setConfirmOpen(true);
                            setDeletingContact(contact);
                          }}
                        >
                          <DeleteOutlineIcon style={{ color: "#E57373" }} />
                        </IconButton>
                      )}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View */}
        <div className={classes.mobileCardContainer}>
          {contacts.map((contact) => (
            <Paper key={contact.id} className={classes.contactCard}>
              <div className={classes.cardContent}>
                <div className={classes.cardHeader}>
                  <Avatar src={contact?.urlPicture} alt={contact.name} />
                  <div style={{ flex: 1 }}>
                    <Typography variant="subtitle1" style={{ fontWeight: 500 }}>
                      {contact.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {enableLGPD && hideNum && user.profile === "user"
                        ? contact.isGroup
                          ? contact.number
                          : formatSerializedId(contact?.number) === null
                          ? contact.number.slice(0, -6) +
                            "**-**" +
                            contact?.number.slice(-2)
                          : formatSerializedId(contact?.number)?.slice(0, -6) +
                            "**-**" +
                            contact?.number?.slice(-2)
                        : contact.isGroup
                        ? contact.number
                        : formatSerializedId(contact?.number)}
                    </Typography>
                  </div>
                  <IconButton
                    className={classes.infoButton}
                    size="small"
                    onClick={() => handleOpenInfo(contact)}
                  >
                    <InfoOutlined />
                  </IconButton>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "16px",
                  }}
                >
                  <div style={{ display: "flex", gap: 8 }}>
                    <IconButton
                      size="small"
                      disabled={!contact.active}
                      onClick={() => checkContactStatus(contact)}
                    >
                      {contact.channel === "whatsapp" && (
                        <WhatsApp style={{ color: "#25d366" }} />
                      )}
                      {contact.channel === "instagram" && (
                        <Instagram style={{ color: "#e1306c" }} />
                      )}
                      {contact.channel === "facebook" && (
                        <Facebook style={{ color: "#3b5998" }} />
                      )}
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => hadleEditContact(contact.id)}
                    >
                      <EditIcon style={{ color: "#08c2c2" }} />
                    </IconButton>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <IconButton
                      size="small"
                      onClick={() => {
                        if (contact.active) {
                          setConfirmOpen(true);
                          setBlockingContact(contact);
                        } else {
                          setConfirmOpen(true);
                          setUnBlockingContact(contact);
                        }
                      }}
                    >
                      {contact.active ? (
                        <BlockIcon style={{ color: "#E57373" }} />
                      ) : (
                        <CheckCircleIcon style={{ color: "#4CAF50" }} />
                      )}
                    </IconButton>
                    <Can
                      role={user.profile}
                      perform="contacts-page:deleteContact"
                      yes={() => (
                        <IconButton
                          size="small"
                          onClick={() => {
                            setConfirmOpen(true);
                            setDeletingContact(contact);
                          }}
                        >
                          <DeleteOutlineIcon style={{ color: "#E57373" }} />
                        </IconButton>
                      )}
                    />
                  </div>
                </div>
              </div>
            </Paper>
          ))}
        </div>

        {loading && (
          <div className={classes.loadingContainer}>
            <CircularProgress size={40} />
          </div>
        )}

        <input
          style={{ display: "none" }}
          id="upload"
          type="file"
          accept=".xls,.xlsx"
          onChange={() => setConfirmOpen(true)}
          ref={fileUploadRef}
        />
      </Paper>
    </MainContainer>
  );
};

export default Contacts;
