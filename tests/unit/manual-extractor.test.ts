import { findContainer, startManualSelection } from "../../src/content/extractor/manual";

describe("findContainer", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("returns element itself when tag is in ACCEPTED_TAGS", () => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    expect(findContainer(div)).toBe(div);
  });

  it("returns body when given body", () => {
    expect(findContainer(document.body)).toBe(document.body);
  });

  it("returns body when given null", () => {
    expect(findContainer(null)).toBe(document.body);
  });

  it("climbs to accepted parent when tag not accepted", () => {
    const article = document.createElement("article");
    const span = document.createElement("span");
    article.appendChild(span);
    document.body.appendChild(article);
    expect(findContainer(span)).toBe(article);
  });

  it("climbs multiple levels to find accepted container", () => {
    const section = document.createElement("section");
    const p = document.createElement("p");
    const em = document.createElement("em");
    section.appendChild(p);
    p.appendChild(em);
    document.body.appendChild(section);
    expect(findContainer(em)).toBe(section);
  });

  it("returns body when no accepted ancestor found above unknown tags", () => {
    // Build: header > nav > span — none of these are accepted
    const header = document.createElement("header");
    const nav = document.createElement("nav");
    const span = document.createElement("span");
    nav.appendChild(span);
    header.appendChild(nav);
    document.body.appendChild(header);
    // header and nav are not in ACCEPTED_TAGS, should climb to body
    expect(findContainer(span)).toBe(document.body);
  });
});

describe("startManualSelection", () => {
  it("returns a teardown function", () => {
    const teardown = startManualSelection(jest.fn());
    expect(typeof teardown).toBe("function");
    teardown(); // clean up
  });

  it("sets cursor to crosshair on body", () => {
    const teardown = startManualSelection(jest.fn());
    expect(document.body.style.cursor).toBe("crosshair");
    teardown();
  });

  it("resets cursor on teardown", () => {
    const teardown = startManualSelection(jest.fn());
    teardown();
    expect(document.body.style.cursor).toBe("");
  });

  it("calls onCapture with correct content when body is clicked", () => {
    const onCapture = jest.fn();
    const teardown = startManualSelection(onCapture);

    const div = document.createElement("div");
    div.innerHTML = "<p>Target content</p>";
    document.body.appendChild(div);

    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    div.dispatchEvent(event);

    expect(onCapture).toHaveBeenCalledTimes(1);
    const captured = onCapture.mock.calls[0][0];
    expect(captured.html).toContain("Target content");

    document.body.removeChild(div);
    teardown();
  });
});
