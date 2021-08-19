import { screen } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import { ROUTES_PATH, ROUTES } from "../constants/routes";
import Router from "../app/Router";
import Firestore from "../app/Firestore";
import firebase from "../__mocks__/firebase";
import userEvent from "@testing-library/user-event";
import Bills from "../containers/Bills";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", () => {
      Firestore.bills = () => ({ bills, get: jest.fn().mockResolvedValue() });
      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );

      const html = BillsUI({ data: bills });
      const pathname = ROUTES_PATH["Bills"];
      Object.defineProperty(window, "location", { value: { hash: pathname } });
      document.body.innerHTML = `<div id='root'>${html}</div>`;
      Router();

      expect(screen.getByTestId("icon-window").classList.contains("active-icon")).toBe(true);
    });

    test("Then bills should be ordered from earliest to latest", () => {
      const html = BillsUI({ data: bills });
      document.body.innerHTML = html;
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });
  });
  describe("When I am on Bills page but back-end send an error message", () => {
    test("Then, Error page should be rendered", () => {
      const html = BillsUI({ error: "some error message" });
      document.body.innerHTML = html;
      expect(screen.getAllByText("Erreur")).toBeTruthy();
    });
  });

  describe("When I am on Bills page", () => {
    describe("When I click on the icon eye", () => {
      test("A modal should open", () => {
        const newbills = [...bills];
        const html = BillsUI({ data: newbills });
        document.body.innerHTML = html;
        const billsContainer = new Bills({
          document,
          onNavigate,
          bills: newbills,
          firestore: null,
          localStorage: window.localStorage,
        });

        // To mock bootstrap .modal
        $.fn.modal = jest.fn();
        const icons = screen.getAllByTestId("icon-eye");
        const icon1 = icons[0];
        const handleClickIconEye = jest.fn((e) => billsContainer.handleClickIconEye(icon1));
        icon1.addEventListener("click", handleClickIconEye);
        userEvent.click(icon1);
        expect(handleClickIconEye).toHaveBeenCalled();
        const modale = document.getElementById("modaleFile");
        expect(modale).toBeTruthy();
      });
    });
  });

  describe("When I am on Bills page", () => {
    describe("When I click on the new bill button", () => {
      test("Then, NewBill page should be rendered", () => {
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
        const html = BillsUI({ data: [] });
        document.body.innerHTML = html;
        const billsContainer = new Bills({
          document,
          onNavigate,
          firestore: null,
          localStorage: window.localStorage,
        });

        const newBillButton = screen.getByTestId("btn-new-bill");
        const handleClickNewBill = jest.fn(() => billsContainer.handleClickNewBill);
        newBillButton.addEventListener("click", handleClickNewBill);
        userEvent.click(newBillButton);
        expect(screen.getAllByText("Envoyer une note de frais")).toBeTruthy();
      });
    });
  });

  // test d'intégration GET
  describe("When I navigate to Bills", () => {
    test("fetches bills from mock API GET", async () => {
      const getSpy = jest.spyOn(firebase, "get");
      const bills = await firebase.get();
      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(bills.data.length).toBe(4);
    });
    test("fetches bills from an API and fails with 404 message error", async () => {
      firebase.get.mockImplementationOnce(() => Promise.reject(new Error("Erreur 404")));
      const html = BillsUI({ error: "Erreur 404" });
      document.body.innerHTML = html;
      const message = await screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });
    test("fetches messages from an API and fails with 500 message error", async () => {
      firebase.get.mockImplementationOnce(() => Promise.reject(new Error("Erreur 500")));
      const html = BillsUI({ error: "Erreur 500" });
      document.body.innerHTML = html;
      const message = await screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });
  });
});
