import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import App from "../App.vue";

describe("App", () => {
  it("mounts without crashing", () => {
    const wrapper = mount(App, {
      global: {
        stubs: {
          RouterView: true, // Stub out RouterView to avoid router dependency
        },
      },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it("contains RouterView", () => {
    const wrapper = mount(App, {
      global: {
        stubs: {
          RouterView: true,
        },
      },
    });

    expect(wrapper.html()).toContain("router-view-stub");
  });
});
