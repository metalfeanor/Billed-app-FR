import { ROUTES_PATH } from "../constants/routes.js";
import Logout from "./Logout.js";

export default class NewBill {
  constructor({ document, onNavigate, firestore, localStorage }) {
    this.document = document;
    this.onNavigate = onNavigate;
    this.firestore = firestore;
    const formNewBill = this.document.querySelector(`form[data-testid="form-new-bill"]`);
    formNewBill.addEventListener("submit", this.handleSubmit);
    const file = this.document.querySelector(`input[data-testid="file"]`);
    file.addEventListener("change", this.handleChangeFile);
    this.fileUrl = null;
    this.fileName = null;
    new Logout({ document, localStorage, onNavigate });
  }
  checkFileExtension = (path) => {
    var basename = path.split(/[\\/]/).pop(), // extract file name from full path ...
      // (supports `\\` and `/` separators)
      pos = basename.lastIndexOf("."); // get last position of `.`

    if (basename === "" || pos < 1) return false; // return false if file name is empty or `.` not found (-1) or comes first (0)

    if (basename.slice(pos + 1).match(/(png|jpg|jpeg)/g)) {
      return true;
    } else {
      return false;
    } // return true if match to regex
  };
  handleChangeFile = (e) => {
    const input = this.document.querySelector(`input[data-testid="file"]`);
    const file = input.files[0];
    const filePath = e.target.value.split(/\\/g);
    const fileName = filePath[filePath.length - 1];
    if (!this.checkFileExtension(fileName)) {
      input.value = "";
      return alert("Veuillez insérer un justificatif au format .jpg, .jpeg ou .png ");
    }
    this.firestore.storage
      .ref(`justificatifs/${fileName}`)
      .put(file)
      .then((snapshot) => snapshot.ref.getDownloadURL())
      .then((url) => {
        this.fileUrl = url;
        this.fileName = fileName;
      });
  };
  handleSubmit = (e) => {
    e.preventDefault();
    console.log('e.target.querySelector(`input[data-testid="datepicker"]`).value', e.target.querySelector(`input[data-testid="datepicker"]`).value);

    const email = JSON.parse(localStorage.getItem("user")).email;
    const bill = {
      email,
      type: e.target.querySelector(`select[data-testid="expense-type"]`).value,
      name: e.target.querySelector(`input[data-testid="expense-name"]`).value,
      amount: parseInt(e.target.querySelector(`input[data-testid="amount"]`).value),
      date: e.target.querySelector(`input[data-testid="datepicker"]`).value,
      vat: e.target.querySelector(`input[data-testid="vat"]`).value,
      pct: parseInt(e.target.querySelector(`input[data-testid="pct"]`).value) || 20,
      commentary: e.target.querySelector(`textarea[data-testid="commentary"]`).value,
      fileUrl: this.fileUrl,
      fileName: this.fileName,
      status: "pending",
    };
    this.createBill(bill);
    this.onNavigate(ROUTES_PATH["Bills"]);
  };

  // not need to cover this function by tests
  createBill = (bill) => {
    if (this.firestore) {
      this.firestore
        .bills()
        .add(bill)
        .then(() => {
          this.onNavigate(ROUTES_PATH["Bills"]);
        })
        .catch((error) => error);
    }
  };
}
