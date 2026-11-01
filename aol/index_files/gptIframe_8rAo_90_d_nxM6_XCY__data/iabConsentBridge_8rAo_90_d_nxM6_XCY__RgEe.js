(() => {
  (() => {
    "use strict";
    var t = t => {
        for (var a, i = window; i; ) {
          try {
            if (i.frames[t]) {
              a = i;
              break;
            }
          } catch (e) {
            return;
          }
          if (i === window.top) break;
          i = i.parent;
        }
        return a;
      },
      a = (t, a, i) => {
        var e = {};
        try {
          e = "string" == typeof t.data ? JSON.parse(t.data) : t.data;
        } catch (r) {
          return;
        }
        var n = e[a];
        n && "function" == typeof i[n.callId] && (i[n.callId](n.returnValue, n.success), delete i[n.callId]);
      },
      i = () => {
        var t,
          a = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_",
          i = window.crypto || window.msCrypto;
        try {
          t = Array.from(i.getRandomValues(new Uint32Array(32)))
            .map(t => a[t % 64])
            .join("");
        } catch (e) {
          t = Math.random() + "";
        }
        return t;
      };
    (e => {
      var n, r;
      if (!window.__gpp) {
        if (window === window.top) return void e({ msg: "API not found" }, !1);
        ((n = t("__gppLocator")),
          (r = {}),
          (window.__gpp = (t, a, e) => {
            if (n) {
              var o = i(),
                s = {
                  __gppCall: {
                    command: t,
                    parameter: e,
                    callId: o,
                  },
                };
              ((r[o] = a), n.postMessage(s, "*"));
            } else
              a(
                {
                  msg: "CMP not found",
                },
                !1,
              );
          }),
          window.addEventListener(
            "message",
            t => {
              a(t, "__gppReturn", r);
            },
            !1,
          ));
      }
      window.__gpp("addEventListener", (t, a) => {
        a && "error" !== t.pingData.cmpStatus ? "ready" === t.pingData.signalStatus && e(t, !0) : e(void 0, !1);
      });
    })((e, n) => {
      (e => {
        var n, r;
        if (!window.__tcfapi) {
          if (window === window.top) return void e({ msg: "API not found" }, !1);
          ((n = t("__tcfapiLocator")),
            (r = {}),
            (window.__tcfapi = (t, a, e, o) => {
              if (n) {
                var s = i(),
                  p = {
                    __tcfapiCall: { command: t, parameter: o, version: a, callId: s },
                  };
                ((r[s] = e), n.postMessage(p, "*"));
              } else e({ msg: "CMP not found" }, !1);
            }),
            window.addEventListener(
              "message",
              t => {
                a(t, "__tcfapiReturn", r);
              },
              !1,
            ));
        }
        window.__tcfapi("addEventListener", 2, (t, a) => {
          a && "error" !== t.cmpStatus
            ? ("tcloaded" !== t.eventStatus && "useractioncomplete" !== t.eventStatus) || e(t, !0)
            : e(void 0, !1);
        });
      })((n, r) => {
        (e => {
          var n, r;
          if (!window.__uspapi) {
            if (window === window.top) return void e({ msg: "API not found" }, !1);
            ((n = t("__uspapiLocator")),
              (r = {}),
              (window.__uspapi = (t, a, e) => {
                if (n) {
                  var o = i(),
                    s = {
                      __uspapiCall: { command: t, parameter: a, callId: o },
                    };
                  ((r[o] = e), n.postMessage(s, "*"));
                } else e({ msg: "API not found" }, !1);
              }),
              window.addEventListener(
                "message",
                t => {
                  a(t, "__uspapiReturn", r);
                },
                !1,
              ));
          }
          window.__uspapi("getUSPData", null, (t, a) => {
            a
              ? e(
                  {
                    uspVersion: t.version,
                    uspString: t.uspString,
                    isOathFirstParty: t.isOathFirstParty,
                  },
                  !0,
                )
              : e(void 0, !1);
          });
        })((t, a) => {
          var i = (e && e.pingData) || {};
          (n.tcString, n.gdprApplies, i.gppString, i.applicableSections && i.applicableSections.join(","), t.uspString);
        });
      });
    });
  })();
})();
