import React, { useContext, useState, useEffect, useRef } from "react";

import * as Yup from "yup";
import { Formik, Form, Field } from "formik";
import { toast } from "react-toastify";

import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import CircularProgress from "@material-ui/core/CircularProgress";
import AttachFileIcon from "@material-ui/icons/AttachFile";
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import IconButton from "@material-ui/core/IconButton";
import { i18n } from "../../translate/i18n";
import { head } from "lodash";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import MessageVariablesPicker from "../MessageVariablesPicker";
import ButtonWithSpinner from "../ButtonWithSpinner";

import {
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
} from "@material-ui/core";
import ConfirmationModal from "../ConfirmationModal";

const path = require('path');

const useStyles = makeStyles((theme) => ({
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
  searchInput: {
    width: "300px",
    "& .MuiOutlinedInput-root": {
      borderRadius: 8,
    },
  },
  actionButtons: {
    backgroundColor: "#08c2c2",
    color: "white",
    "&:hover": {
      backgroundColor: "#07b0b0",
    },
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
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing(3),
    "& > *": {
      color: "#08c2c2",
    },
  },
  loadingText: {
    marginLeft: theme.spacing(2),
    color: "#171717",
  },
  btnWrapper: {
    position: "relative",
  },
  buttonProgress: {
    color: green[500],
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -12,
    marginLeft: -12,
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120,
  },
  colorAdorment: {
    width: 20,
    height: 20,
  },
  dialog: {
    "& .MuiDialog-paperWidthXs": {
      maxWidth: "500px",
    },
    "& .MuiDialog-paper": {
      borderRadius: "8px",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    },
  },
  dialogContent: {
    padding: theme.spacing(2),
    "& .MuiGrid-spacing-xs-2": {
      width: "100%",
      margin: 0,
    },
  },
  dialogActions: {
    padding: theme.spacing(2),
    borderTop: "1px solid #e0e0e0",
    justifyContent: "flex-end",
  },
}));

const QuickeMessageSchema = Yup.object().shape({
  shortcode: Yup.string().required("Obrigatório"),
  //   message: Yup.string().required("Obrigatório"),
});

const QuickMessageDialog = ({ open, onClose, quickemessageId, reload }) => {
  const classes = useStyles();
  const { user } = useContext(AuthContext);

  const messageInputRef = useRef();

  const initialState = {
    shortcode: "",
    message: "",
    geral: false,
    status: true,
  };

  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [quickemessage, setQuickemessage] = useState(initialState);
  const [attachment, setAttachment] = useState(null);
  const attachmentFile = useRef(null);

  useEffect(() => {
    try {
      (async () => {
        if (!quickemessageId) return;

        const { data } = await api.get(`/quick-messages/${quickemessageId}`);

        setQuickemessage((prevState) => {
          return { ...prevState, ...data };
        });
      })();
    } catch (err) {
      toastError(err);
    }
  }, [quickemessageId, open]);

  const handleClose = () => {
    setQuickemessage(initialState);
    setAttachment(null);
    onClose();
  };

  const handleAttachmentFile = (e) => {
    const file = head(e.target.files);
    if (file) {
      setAttachment(file);
    }
  };

  const handleSaveQuickeMessage = async (values) => {

    const quickemessageData = { ...values, isMedia: true, mediaPath: attachment ? String(attachment.name).replace(/ /g, "_") : values.mediaPath ? path.basename(values.mediaPath).replace(/ /g, "_") : null };

    try {
      if (quickemessageId) {
        await api.put(`/quick-messages/${quickemessageId}`, quickemessageData);
        if (attachment != null) {
          const formData = new FormData();
          formData.append("typeArch", "quickMessage");
          formData.append("file", attachment);
          await api.post(
            `/quick-messages/${quickemessageId}/media-upload`,
            formData
          );
        }
      } else {
        const { data } = await api.post("/quick-messages", quickemessageData);
        if (attachment != null) {
          const formData = new FormData();
          formData.append("typeArch", "quickMessage");
          formData.append("file", attachment);
          await api.post(`/quick-messages/${data.id}/media-upload`, formData);
        }
      }
      toast.success(i18n.t("quickMessages.toasts.success"));
      if (typeof reload == "function") {
        console.log(reload);
        console.log("0");
        reload();
      }
    } catch (err) {
      toastError(err);
    }
    handleClose();
  };

  const deleteMedia = async () => {
    if (attachment) {
      setAttachment(null);
      attachmentFile.current.value = null;
    }

    if (quickemessage.mediaPath) {
      await api.delete(`/quick-messages/${quickemessage.id}/media-upload`);
      setQuickemessage((prev) => ({
        ...prev,
        mediaPath: null,
      }));
      toast.success(i18n.t("quickMessages.toasts.deleted"));
      if (typeof reload == "function") {
        console.log(reload);
        console.log("1");
        reload();
      }
    }
  };

  const handleClickMsgVar = async (msgVar, setValueFunc) => {
    const el = messageInputRef.current;
    const firstHalfText = el.value.substring(0, el.selectionStart);
    const secondHalfText = el.value.substring(el.selectionEnd);
    const newCursorPos = el.selectionStart + msgVar.length;

    setValueFunc("message", `${firstHalfText}${msgVar}${secondHalfText}`);

    await new Promise(r => setTimeout(r, 100));
    messageInputRef.current.setSelectionRange(newCursorPos, newCursorPos);
  };

  return (
    <div className={classes.root}>
      <ConfirmationModal
        title={i18n.t("quickMessages.confirmationModal.deleteTitle")}
        open={confirmationOpen}
        onClose={() => setConfirmationOpen(false)}
        onConfirm={deleteMedia}
      >
        {i18n.t("quickMessages.confirmationModal.deleteMessage")}
      </ConfirmationModal>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="xs"
        fullWidth
        scroll="paper"
        className={classes.dialog}
      >
        <DialogTitle id="form-dialog-title">
          {quickemessageId
            ? `${i18n.t("quickMessages.dialog.edit")}`
            : `${i18n.t("quickMessages.dialog.add")}`}
        </DialogTitle>
        <div style={{ display: "none" }}>
          <input
            type="file"
            // accept="Image/*, Video/*"
            ref={attachmentFile}
            onChange={(e) => handleAttachmentFile(e)}
          />
        </div>
        <Formik
          initialValues={quickemessage}
          enableReinitialize={true}
          validationSchema={QuickeMessageSchema}
          onSubmit={(values, actions) => {
            setTimeout(() => {
              handleSaveQuickeMessage(values);
              actions.setSubmitting(false);
            }, 400);
          }}
        >
          {({ touched, errors, isSubmitting, setFieldValue, values }) => (
            <Form>
              <DialogContent dividers className={classes.dialogContent}>
                <Grid spacing={2} container>
                  <Grid xs={12} item>
                    <Field
                      as={TextField}
                      autoFocus
                      label={i18n.t("quickMessages.dialog.shortcode")}
                      name="shortcode"
                      disabled={quickemessageId && values.visao && !values.geral && values.userId !== user.id}
                      error={touched.shortcode && Boolean(errors.shortcode)}
                      helperText={touched.shortcode && errors.shortcode}
                      variant="outlined"
                      margin="dense"
                      fullWidth
                    />
                  </Grid>
                  <Grid xs={12} item>
                    <Field
                      as={TextField}
                      label={i18n.t("quickMessages.dialog.message")}
                      name="message"
                      inputRef={messageInputRef}
                      error={touched.message && Boolean(errors.message)}
                      helperText={touched.message && errors.message}
                      variant="outlined"
                      margin="dense"
                      disabled={quickemessageId && values.visao && !values.geral && values.userId !== user.id}
                      multiline={true}
                      rows={7}
                      fullWidth
                    // disabled={quickemessage.mediaPath || attachment ? true : false}
                    />
                  </Grid>
                  <Grid item>
                    <MessageVariablesPicker
                      disabled={isSubmitting || (quickemessageId && values.visao && !values.geral && values.userId !== user.id)}
                      onClick={value => handleClickMsgVar(value, setFieldValue)}
                    />
                  </Grid>
                  {/* {(profile === "admin" || profile === "supervisor") && ( */}
                  <Grid xs={12} item>
                    <FormControl variant="outlined" margin="dense" fullWidth>
                      <InputLabel id="geral-selection-label">
                        {i18n.t("quickMessages.dialog.visao")}
                      </InputLabel>
                      <Field
                        as={Select}
                        label={i18n.t("quickMessages.dialog.visao")}
                        placeholder={i18n.t("quickMessages.dialog.visao")}
                        labelId="visao-selection-label"
                        id="visao"
                        disabled={quickemessageId && values.visao && !values.geral && values.userId !== user.id}
                        name="visao"
                        onChange={(e) => {
                          setFieldValue("visao", e.target.value === "true");
                        }}
                        error={touched.visao && Boolean(errors.visao)}
                        value={values.visao ? "true" : "false"} // Converte o valor booleano para string
                      >
                        <MenuItem value={"true"}>{i18n.t("announcements.active")}</MenuItem>
                        <MenuItem value={"false"}>{i18n.t("announcements.inactive")}</MenuItem>
                      </Field>
                    </FormControl>
                    {/* Renderização condicional do novo item */}
                    {values.visao === true && (
                      <FormControl variant="outlined" margin="dense" fullWidth>
                        <InputLabel id="geral-selection-label">
                          {i18n.t("quickMessages.dialog.geral")}
                        </InputLabel>
                        <Field
                          as={Select}
                          label={i18n.t("quickMessages.dialog.geral")}
                          placeholder={i18n.t("quickMessages.dialog.geral")}
                          labelId="novo-item-selection-label"
                          id="geral"
                          name="geral"
                          disabled={quickemessageId && values.visao && !values.geral && values.userId !== user.id}
                          value={values.geral ? "true" : "false"} // Converte o valor booleano para string
                          error={touched.geral && Boolean(errors.geral)}
                        >
                          <MenuItem value={"true"}>{i18n.t("announcements.active")}</MenuItem>
                          <MenuItem value={"false"}>{i18n.t("announcements.inactive")}</MenuItem>
                        </Field>
                      </FormControl>
                    )}
                  </Grid>
                  {/* )} */}
                  {(quickemessage.mediaPath || attachment) && (
                    <Grid xs={12} item>
                      <Button startIcon={<AttachFileIcon />}>
                        {attachment ? attachment.name : quickemessage.mediaName}
                      </Button>
                      <IconButton
                        onClick={() => setConfirmationOpen(true)}
                        color="secondary"
                        disabled={quickemessageId && values.visao && !values.geral && values.userId !== user.id}
                      >
                        <DeleteOutlineIcon color="secondary" />
                      </IconButton>
                    </Grid>
                  )}
                </Grid>
              </DialogContent>
              <DialogActions className={classes.dialogActions}>
                {!attachment && !quickemessage.mediaPath && (
                  <Button
                    color="primary"
                    onClick={() => attachmentFile.current.click()}
                    disabled={isSubmitting || (quickemessageId && values.visao && !values.geral && values.userId !== user.id)}
                    variant="outlined"
                  >
                    {i18n.t("quickMessages.buttons.attach")}
                  </Button>
                )}
                <Button
                  onClick={handleClose}
                  color="secondary"
                  disabled={isSubmitting}
                  variant="outlined"
                >
                  {i18n.t("quickMessages.buttons.cancel")}
                </Button>
                <Button
                  type="submit"
                  color="primary"
                  disabled={isSubmitting || (quickemessageId && values.visao && !values.geral && values.userId !== user.id)}
                  variant="contained"
                  className={classes.btnWrapper}
                >
                  {quickemessageId
                    ? `${i18n.t("quickMessages.buttons.edit")}`
                    : `${i18n.t("quickMessages.buttons.add")}`}
                  {isSubmitting && (
                    <CircularProgress
                      size={24}
                      className={classes.buttonProgress}
                    />
                  )}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
    </div>
  );
};

export default QuickMessageDialog;