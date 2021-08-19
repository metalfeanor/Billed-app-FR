import { fireEvent, screen } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import userEvent from "@testing-library/user-event";
import { ROUTES_PATH, ROUTES } from "../constants/routes";
import firebase from "../__mocks__/firebase";
import BillsUI from "../views/BillsUI.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page and i submit form with an image .jpg, .jpeg, or .png", () => {
    test("Then, it should create a new bill", () => {
      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const html = NewBillUI();
      document.body.innerHTML = html;
      const newBillsContainer = new NewBill({
        document,
        onNavigate,
        firestore: null,
        localStorage: window.localStorage,
      });
      const handleChangeFile = jest.fn((e) => newBillsContainer.handleChangeFile);
      const file = screen.getByTestId("file");
      file.addEventListener("change", handleChangeFile);
      fireEvent.change(file, {
        target: {
          files: [
            new File(["facture"], "facture.jpg", {
              type: "image/jpg",
            }),
          ],
        },
      });
      const fileName = file.files[0].name;
      expect(file.files[0].type).toBe("image/jpg");
      expect(handleChangeFile).toHaveBeenCalled();
      expect(newBillsContainer.checkFileExtension(fileName)).toBe(true);
      expect(screen.getAllByText("Envoyer une note de frais")).toBeTruthy();
      const submitBtn = screen.getByText("Envoyer");
      const handleSubmit = jest.fn((e) => newBillsContainer.handleSubmit);
      submitBtn.addEventListener("click", handleSubmit);
      userEvent.click(submitBtn);
      expect(handleSubmit).toHaveBeenCalled();
      expect(screen.getAllByText("Mes notes de frais")).toBeTruthy();
    });
  });

  describe("When I am on NewBill Page and i submit form with an image .gif", () => {
    test("Then, i should stay on newBill page", () => {
      jest.spyOn(window, "alert");
      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const html = NewBillUI();
      document.body.innerHTML = html;
      const newBillsContainer = new NewBill({
        document,
        onNavigate,
        firestore: null,
        localStorage: window.localStorage,
      });
      const handleChangeFile = jest.fn((e) => newBillsContainer.handleChangeFile);

      const file = screen.getByTestId("file");
      file.addEventListener("change", handleChangeFile);
      fireEvent.change(file, {
        target: {
          files: [
            new File(["image"], "image.gif", {
              type: "image/gif",
            }),
          ],
        },
      });

      const fileName = file.files[0].name;
      expect(file.files[0].type).toBe("image/gif");
      expect(handleChangeFile).toHaveBeenCalled();

      expect(newBillsContainer.checkFileExtension(fileName)).toBe(false);
      expect(window.alert).toHaveBeenCalledTimes(1);
      expect(screen.getAllByText("Envoyer une note de frais")).toBeTruthy();
    });
  });

  // test d'intégration POST
  describe("When I create a new bill", () => {
    test("adding a bill from mock API POST", async () => {
      const getSpy = jest.spyOn(firebase, "post");
      const email = "johndoe@email.com";
      const theNewBill = {
        email,
        type: "Restaurants et bars",
        name: "facture.jpg",
        amount: 500,
        date: "2021-08-16",
        vat: "20",
        pct: 20,
        commentary: "test post API",
        fileUrl: "https://google.com",
        fileName: "facture.jpg",
        status: "pending",
      };
      const bill = await firebase.post(theNewBill);
      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(bill.data.length).toBe(1);
    });
    test("addind a bill from an API and fails with 404 message error", async () => {
      firebase.post.mockImplementationOnce(() => Promise.reject(new Error("Erreur 404")));
      const html = BillsUI({ error: "Erreur 404" });
      document.body.innerHTML = html;
      const message = await screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });
    test("adding a bill from an API and fails with 500 message error", async () => {
      firebase.post.mockImplementationOnce(() => Promise.reject(new Error("Erreur 500")));
      const html = BillsUI({ error: "Erreur 500" });
      document.body.innerHTML = html;
      const message = await screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });
  });
});
