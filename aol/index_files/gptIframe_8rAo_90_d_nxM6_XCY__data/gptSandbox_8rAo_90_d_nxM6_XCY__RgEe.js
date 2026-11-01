(function () {
  "use strict";

  // Benji swap note:
  // keep this message protocol unchanged and only replace the Benji runtime bundle source
  // when moving to the rewritten Benji library (aol-ads/libs/benji).

  var MESSAGE_APP_NAME = "MAIL_APP";
  var MESSAGE_TYPE_REQUEST = "REQ";
  var MESSAGE_NAME_REFRESH = "refresh";
  var MESSAGE_NAME_LOADED = "loaded";
  var MESSAGE_NAME_INIT_ERROR = "initError";
  var MESSAGE_NAME_SLOT_RENDER_ENDED = "slotRenderEnded";
  var MESSAGE_NAME_SLOT_REQUESTED = "slotRequested";
  var MESSAGE_NAME_SLOT_RESPONSE_RECEIVED = "slotResponseReceived";
  var MESSAGE_NAME_IMPRESSION_VIEWABLE = "impressionViewable";

  var GPT_CLIENTS = {
    MAIL: "mail",
    BASIC_MAIL: "basicMail",
    LOGIN: "login",
    AOL_LOGIN: "aolLogin",
    AOL_MAIL: "aolMail",
    AOL_BASIC_MAIL: "aolBasicMail",
    NOVATION: "novation",
  };

  var BENJI_EVENTS = {
    RENDER_SUCCEEDED: "RENDER_SUCCEEDED",
    RENDER_FAILED: "RENDER_FAILED",
    SLOT_REQUESTED: "SLOT_REQUESTED",
    SLOT_RESPONSE_RECEIVED: "SLOT_RESPONSE_RECEIVED",
    IMPRESSION_VIEWABLE: "IMPRESSION_VIEWABLE",
  };

  var BENJI_POSITION_REGION = "index";
  var DEFAULT_GPT_DIV = "gpt-passback";
  var AD_STACKING_WRAPPER_PREFIX = "ad-stacking-wrapper-";
  var ALLOWED_DOMAINS_APP_REGEX = /^(https:\/\/([a-z0-9-]+[.])*(mail|login)\.(aol|yahoo)\.com)$/;
  var ABP_TARGETING_VALUE = "abp";

  var LREC5_TOP_SPACING = "536px";
  var LREC5_TOP_SPACING_NOVATION = "532px";

  var SENDER_DOMAIN_PREFIX = {
    uk: "emea-",
    de: "emea-",
    ca: "ca-",
    us: "",
  };

  var AdLocations = {
    RIGHT_RAIL: "top_right",
    TOP_CENTER: "top_center",
    EMPTY_FOLDER: "empty_folder",
    SEND_CONFIRMATION: "send_confirm",
    MID_CENTER: "mid_center",
    MESSAGE_LIST: "message_list",
    TABLET_RIGHT_RAIL: "tablet_right_rail",
    TABLET_FOOTER: "tablet_footer",
    MESSAGE_READ_TRIAGE: "message_read_triage",
    DESKTOP_FOOTER: "desktop_footer",
  };

  var AdLocationToLocMap = {
    tablet_right_rail: "top_right",
    tablet_footer: "top_center",
    message_read_triage: "mid_center",
    desktop_footer: "mid_center",
  };

  var DisplayAdPositions = {
    LREC: "LREC",
    LREC4: "LREC4",
    LREC5: "LREC5",
    MON: "MON",
    SKY: "SKY",
    FULL_PANE: "FULL_PANE",
    FULL_SCREEN: "FULL_SCREEN",
    HORIZON_DESKTOP: "HORIZON_DESKTOP",
    HORIZON_MOBILE: "HORIZON_MOBILE",
    BILLBOARD: "BILLBOARD",
    FLUID: "FLUID",
    SPOTLIGHT: "SPOTLIGHT",
    LIGHTHOUSE: "LIGHTHOUSE",
    MEDIUM_RECTANGLE: "MEDIUM_RECTANGLE",
    LEADERBOARD: "LEADERBOARD",
    NATIVE_MOBILE_LEADERBOARD: "NATIVE_MOBILE_LEADERBOARD",
    DESKTOP_LEADERBOARD: "DESKTOP_LEADERBOARD",
    DESKTOP_LEADERBOARD_FOOTER: "DESKTOP_LEADERBOARD_FOOTER",
  };

  var RIGHT_RAIL_AD_SLOT_ID = {
    LREC: "Slot300_250_1",
    LREC4: "Slot300_250_2",
    LREC5: "Slot300_250_3",
    MON: "Slot300_600",
    SKY: "Slot160_600",
  };

  var AdSize = {
    LREC: [300, 250],
    LREC4: [300, 250],
    LREC5: [300, 250],
    MON: [300, 600],
    SKY: [160, 600],
    FULL_PANE: [1200, 800],
    FULL_SCREEN: [1440, 1024],
    HORIZON_DESKTOP: [3, 1],
    HORIZON_MOBILE: [3, 1],
    SPOTLIGHT: [3, 2],
    LIGHTHOUSE: [2, 2],
    MEDIUM_RECTANGLE: [300, 250],
    BILLBOARD: [970, 250],
    FLUID: [0, 0],
    LEADERBOARD: [320, 50],
    NATIVE_MOBILE_LEADERBOARD: [380, 100],
    DESKTOP_LEADERBOARD: [728, 90],
    DESKTOP_LEADERBOARD_FOOTER: [728, 90],
  };

  var BENJI_SITE = {
    mail: "yahoo_mail",
    novation: "yahoo_mail",
    basicMail: "yahoo_mail",
    aolMail: "aol_webmail",
    aolBasicMail: "aol_webmail",
    login: "yahoo_login",
    aolLogin: "aol_login",
  };

  var TAXONOMY_TYPES = {
    IAB: "IAB",
    PEER39: "PEER39",
  };

  var TAXONOMY_VERSIONS_TO_ID_MAP = {
    IAB: {
      2.2: "YAHOO_IAB_CONTENT_2_2",
      3.1: "YAHOO_IAB_CONTENT_3_1",
    },
    PEER39: {
      "1.0": "PEER_39",
    },
  };

  var IAB_ID_SEGTAX_MAP = {
    YAHOO_IAB_CONTENT_2_2: 6,
    YAHOO_IAB_CONTENT_3_1: 9,
  };

  var TAXONOMY_TYPE_TO_DOMAIN_MAP = {
    IAB: "yahoo.com",
  };

  var messageId = 0;
  var messageTargetOrigin = "*";
  var currentConfig = {};
  var cachedClient = GPT_CLIENTS.MAIL;
  var refreshListenerAttached = false;

  function parseQuery(str) {
    var query = {};

    if (!str || str.length < 2) {
      return query;
    }

    var pairs = str.substring(1).split("&");
    for (var index = 0; index < pairs.length; index += 1) {
      var pair = pairs[index].split("=");
      var key = decodeURIComponent(pair[0] || "");
      if (!key) {
        continue;
      }

      query[key] = decodeURIComponent(pair[1] || "");
    }

    return query;
  }

  function parseConfigFromHash() {
    var hash = window.location.hash ? window.location.hash.substring(1) : "";
    if (!hash) {
      return undefined;
    }

    try {
      var hashPairs = hash.split("=");
      var configString = hashPairs[1] || "{}";
      return JSON.parse(decodeURIComponent(configString));
    } catch {
      return undefined;
    }
  }

  function parseBoolean(value) {
    return value === true || value === "true" || value === 1 || value === "1";
  }

  function getTargetOrigin(pageUrl) {
    if (typeof pageUrl === "string" && pageUrl.length > 0) {
      try {
        return new globalThis.URL(pageUrl).origin;
      } catch {
        return pageUrl;
      }
    }

    try {
      return new globalThis.URL(document.referrer).origin;
    } catch {
      return "*";
    }
  }

  function resolvePageUrl(pageUrl) {
    if (typeof pageUrl === "string" && pageUrl.length > 0) {
      try {
        return new globalThis.URL(pageUrl).href;
      } catch {
        return pageUrl;
      }
    }

    try {
      if (document.referrer) {
        return new globalThis.URL(document.referrer).href;
      }
    } catch {
      // Ignore URL parsing errors for referrer
    }

    return "";
  }

  function setPubadsPageUrl(pageUrl) {
    var resolvedUrl = resolvePageUrl(pageUrl);
    if (!resolvedUrl) {
      return;
    }

    window.googletag = window.googletag || { cmd: [] };
    window.googletag.cmd = window.googletag.cmd || [];
    window.googletag.cmd.push(function () {
      if (typeof window.googletag.pubads === "function") {
        window.googletag.pubads().set("page_url", resolvedUrl);
      }
    });
  }

  function sendMessageToParent(name, data, targetOrigin) {
    messageId += 1;
    window.parent.postMessage(
      {
        app: MESSAGE_APP_NAME,
        type: MESSAGE_TYPE_REQUEST,
        name: name,
        requestId: messageId,
        data: data || {},
      },
      targetOrigin,
    );
  }

  function sendRequestMessage(name, data) {
    sendMessageToParent(name, data, messageTargetOrigin);
  }

  function sendInitError(message, ymreqid) {
    sendMessageToParent(
      MESSAGE_NAME_INIT_ERROR,
      {
        error: message,
        ymreqid: ymreqid,
      },
      "*",
    );
  }

  function getAdPositionsFromConfig(config) {
    var positions = Array.isArray(config.positions) ? config.positions.slice() : [];

    if (positions.length > 0) {
      return positions;
    }

    if (config.adUnitPath && config.size) {
      positions.push({
        adUnitPath: config.adUnitPath,
        adLocation: config.targetingConfig ? config.targetingConfig.adLocation : undefined,
        size: config.size,
        div: config.div || DEFAULT_GPT_DIV,
      });
    }

    return positions;
  }

  function getLocValue(adLocation, adIndex) {
    if (adLocation === AdLocations.MESSAGE_LIST) {
      var isFirstLeaderboard = adIndex === 1;
      var suffix = isFirstLeaderboard || !adIndex ? "" : "_" + adIndex;
      return AdLocations.MID_CENTER + suffix;
    }

    return AdLocationToLocMap[adLocation] || adLocation;
  }

  function getPositionKVs(input) {
    var senderDomainPrefix = input.region ? SENDER_DOMAIN_PREFIX[input.region] || "" : "";
    var kvs = {
      loc: getLocValue(input.adLocation, input.adIndex),
    };

    if (input.senderMatchedPremiumDomain) {
      kvs[senderDomainPrefix + "senderdomain"] = input.senderMatchedPremiumDomain;
    }
    if (input.senderDomainCategory) {
      kvs[senderDomainPrefix + "senderdomaincategory"] = input.senderDomainCategory;
    }
    if (input.senderDomainSubcategory) {
      kvs[senderDomainPrefix + "senderdomainsubcategory"] = input.senderDomainSubcategory;
    }

    return kvs;
  }

  function positionsMapper(config) {
    var positionConfigs = Array.isArray(config.positions) ? config.positions : [];
    var targeting = config.targetingConfig || {};
    var mapped = {};

    for (var index = 0; index < positionConfigs.length; index += 1) {
      var current = positionConfigs[index] || {};
      var id = current.div;
      if (typeof id !== "string" || id.length === 0) {
        continue;
      }

      mapped[id] = {
        id: id,
        kvs: getPositionKVs({
          adLocation: current.adLocation,
          adIndex: current.adIndex,
          region: targeting.region,
          senderMatchedPremiumDomain: targeting.senderMatchedPremiumDomain || "",
          senderDomainCategory: targeting.senderDomainCategory || "",
          senderDomainSubcategory: targeting.senderDomainSubcategory || "",
        }),
        path: current.adUnitPath,
        region: BENJI_POSITION_REGION,
        size: current.size,
      };

      if (current.stackGroup) {
        mapped[id].stackGroup = current.stackGroup;
      }
    }

    return mapped;
  }

  function extractDivIds(positions) {
    if (!Array.isArray(positions)) {
      return [];
    }

    var divIds = [];
    for (var index = 0; index < positions.length; index += 1) {
      var position = positions[index];
      if (position && typeof position.div === "string") {
        divIds.push(position.div);
      }
    }

    return divIds;
  }

  function removeContainerDivs(positions) {
    if (!Array.isArray(positions)) {
      return;
    }

    for (var index = 0; index < positions.length; index += 1) {
      var position = positions[index] || {};
      var id = position.div;
      if (typeof id !== "string" || id.length === 0) {
        continue;
      }

      var node = document.getElementById(id);
      if (node) {
        node.remove();
      }

      if (position.stackGroup) {
        var collapsed = document.getElementById(id + "-collapse");
        if (collapsed) {
          collapsed.remove();
        }
      }
    }
  }

  function createContainerDivs(positions, addCollapseSuffix) {
    if (!Array.isArray(positions)) {
      return;
    }

    for (var index = 0; index < positions.length; index += 1) {
      var position = positions[index] || {};
      var id = position.div;
      var stackGroup = position.stackGroup;

      if (typeof id !== "string" || id.length === 0) {
        continue;
      }

      var containerNode = document.getElementById(id);
      if (!containerNode && stackGroup) {
        containerNode = document.getElementById(id + "-collapse");
      }
      if (containerNode) {
        continue;
      }

      containerNode = document.createElement("div");
      containerNode.id = id;

      var isLREC5 = id === RIGHT_RAIL_AD_SLOT_ID.LREC5;

      if (stackGroup) {
        var wrapperNodeId = AD_STACKING_WRAPPER_PREFIX + stackGroup;
        var wrapperNode = document.getElementById(wrapperNodeId);

        if (!wrapperNode) {
          wrapperNode = document.createElement("div");
          wrapperNode.id = wrapperNodeId;
          wrapperNode.style.width = "300px";
          wrapperNode.style.height = "600px";
          wrapperNode.style.overflow = "hidden";
          document.body.appendChild(wrapperNode);
        }

        if (addCollapseSuffix && id === RIGHT_RAIL_AD_SLOT_ID.MON) {
          containerNode.id = id + "-collapse";
          containerNode.style.overflow = "hidden";
        }

        wrapperNode.appendChild(containerNode);
        continue;
      }

      if (isLREC5) {
        var rightRailWrapperId = AD_STACKING_WRAPPER_PREFIX + AdLocations.RIGHT_RAIL;
        var rightRailWrapper = document.getElementById(rightRailWrapperId);

        if (!rightRailWrapper) {
          rightRailWrapper = document.createElement("div");
          rightRailWrapper.id = rightRailWrapperId;
          rightRailWrapper.style.width = "300px";
          rightRailWrapper.style.overflow = "hidden";
          rightRailWrapper.style.position = "relative";
          document.body.appendChild(rightRailWrapper);
        }

        rightRailWrapper.style.height = "866px";
        rightRailWrapper.appendChild(containerNode);
        continue;
      }

      document.body.appendChild(containerNode);
    }
  }

  function getBenjiSegmentProviderData(contextualSignals) {
    var signals = contextualSignals || {};
    var result = [];
    var taxonomyKeys = Object.keys(signals);

    for (var keyIndex = 0; keyIndex < taxonomyKeys.length; keyIndex += 1) {
      var taxonomy = taxonomyKeys[keyIndex];
      var signal = signals[taxonomy] || {};
      var versions = signal.versions;

      if (taxonomy !== TAXONOMY_TYPES.IAB && taxonomy !== TAXONOMY_TYPES.PEER39) {
        continue;
      }
      if (!versions || typeof versions !== "object") {
        continue;
      }

      var versionKeys = Object.keys(versions);
      for (var versionIndex = 0; versionIndex < versionKeys.length; versionIndex += 1) {
        var version = versionKeys[versionIndex];
        var versionData = versions[version] || {};
        var segments = Array.isArray(versionData.segments) ? versionData.segments : [];
        var taxonomyIdMap = TAXONOMY_VERSIONS_TO_ID_MAP[taxonomy] || {};
        var id = taxonomyIdMap[version];

        if (segments.length === 0 || typeof id !== "string" || id.length === 0) {
          continue;
        }

        var segmentData = {
          id: id,
          segment: segments.map(function (segmentId) {
            return { id: segmentId };
          }),
        };

        if (TAXONOMY_TYPE_TO_DOMAIN_MAP[taxonomy]) {
          segmentData.name = TAXONOMY_TYPE_TO_DOMAIN_MAP[taxonomy];
        }

        if (IAB_ID_SEGTAX_MAP[id]) {
          segmentData.ext = {
            segtax: IAB_ID_SEGTAX_MAP[id],
          };
        }

        result.push(segmentData);
      }
    }

    return result;
  }

  function shouldDisableAssertiveYield(disableAssertiveYield, client) {
    if (client === GPT_CLIENTS.LOGIN || client === GPT_CLIENTS.AOL_LOGIN) {
      if (typeof disableAssertiveYield !== "undefined") {
        return disableAssertiveYield;
      }

      return true;
    }

    return false;
  }

  function getPageKVs(input) {
    var kvs = {};

    if (input.spaceId) {
      kvs.spaceid = input.spaceId;
    }
    if (input.senderDomain) {
      kvs.senderdomain = input.senderDomain;
    }
    if (input.senderKaminoLevel1) {
      kvs.senderkaminolevel1 = input.senderKaminoLevel1;
    }
    if (input.senderKaminoLevel2) {
      kvs.senderkaminolevel2 = input.senderKaminoLevel2;
    }
    if (input.plid) {
      kvs.plid = input.plid;
    }
    if (input.ver) {
      kvs.ver = input.ver;
    }
    if (input.gppHead) {
      // First 15 chars of the live IAB GPP string at request time, surfaced as
      // a cust_param so the value the CMP emitted can be cross-tabulated against
      // GAM's ServingRestriction in the impression export. 15 chars is enough
      // to identify the GPP section header (DBABBg~ = USCA, DBABMA~ = TCF EU,
      // DBAA = empty) and the first few opt-out bits.
      kvs.gppHead = input.gppHead;
    }
    if (input.gppSid) {
      // IAB GPP applicable-section IDs (e.g. "2" for TCF EU, "8" for USCA,
      // empty when no section is emitted). Surfaced alongside gppHead for
      // post-hoc section analysis in the GAM impression export.
      kvs.gppSid = input.gppSid;
    }
    if (input.usPrivacy) {
      // IAB US Privacy v1 string (e.g. "1YNN" / "1YYN" / "1---"). 4 chars
      // — well under GAM's cust_param value limit.
      kvs.usPrivacy = input.usPrivacy;
    }

    return kvs;
  }

  function getBenjiConfig(input) {
    var config = input.config || {};
    var client = input.client || GPT_CLIENTS.MAIL;
    var haqEnabled = input.haqEnabled === true;

    var targetingConfig = config.targetingConfig || {};
    var headerBidderConfig = config.headerBidderConfig || {};

    var adsh = targetingConfig.adsh;
    var age = targetingConfig.age || 0;
    var gender = targetingConfig.gender || 0;
    var colo = targetingConfig.colo || "";
    var lu = targetingConfig.lu || "";
    var device = targetingConfig.device || "";
    var region = targetingConfig.region || "";
    var lang = targetingConfig.lang || "";
    var spaceId = targetingConfig.spaceId || "";
    var AXIds = targetingConfig.AXIds || "";
    var apuid = targetingConfig.apuid || "";
    var apuidType = targetingConfig.apuidType || "";
    var tblaId = targetingConfig.tblaId || "";
    var adBlocker = targetingConfig.adBlocker || "";
    var senderDomain = targetingConfig.senderDomain;
    var senderKaminoLevel1 = targetingConfig.senderKaminoLevel1;
    var senderKaminoLevel2 = targetingConfig.senderKaminoLevel2;
    var dmiConsent = targetingConfig.dmiConsent;
    var partner = targetingConfig.partner || "";
    var theme = targetingConfig.theme;
    var plid = targetingConfig.plid || "";
    var buckets = Array.isArray(targetingConfig.buckets) ? targetingConfig.buckets : [];
    var ver = targetingConfig.ver || "";
    var gppHead = targetingConfig.gppHead || "";
    var gppSid = targetingConfig.gppSid || "";
    var usPrivacy = targetingConfig.usPrivacy || "";
    var ynet = config.ynet;

    var cobrand = headerBidderConfig.cobrand || "";

    var site = BENJI_SITE[client] || BENJI_SITE[GPT_CLIENTS.MAIL];
    var limited = parseBoolean(config.limited);
    var benjiSegmentProviderData = limited ? [] : getBenjiSegmentProviderData(config.contextualSignals || {});

    var benjiConfig = {
      i13n: {
        bka: String(age),
        bkg: String(gender),
        colo: colo,
        lu: lu,
        site: site,
        device: device,
        region: region,
        lang: lang,
        axids: AXIds,
        apuid: apuid,
        apuidtype: apuidType,
        tbla_id: tblaId,
        cobrand: partner || cobrand,
        partner: partner || cobrand,
        url: config.pageUrl || "",
        usercountry: String(config.geoCountryCode || "").toUpperCase(),
        toscountry: String(config.tosCountryCode || "").toUpperCase(),
        dmi_consent: dmiConsent === "true" || dmiConsent === true,
        plid: plid,
      },
      feature: {
        headerBidding: false,
        enableYahooPrebid: parseBoolean(config.yahooPrebid),
        enableRefreshDebounce: parseBoolean(config.yahooPrebid),
        enableNTSFallback: false,
        enableEdgeToEdge: false,
        enableAdStacking: parseBoolean(config.adStackingV2Enabled),
        collapseWhenNoFill: config.collapseWhenNoFill !== false,
        enablef10d509c: haqEnabled,
        disableAssertiveYield: shouldDisableAssertiveYield(config.disableAssertiveYield, client),
        enableMediaTypeSizeBlocking: parseBoolean(config.mediaTypeSizeBlocking),
        suppressYahooAxid: config.suppressYahooAxid === true,
      },
      setting: {
        renderOnStart: true,
        consent: {
          allowOnlyLimitedAds: limited,
          allowOnlyNonPersonalizedAds: parseBoolean(config.npa),
          allowFirstPartyAds: typeof config.allowFirstPartyAds === "boolean" ? config.allowFirstPartyAds : true,
        },
        tracking: {
          debug: false,
          metrics: false,
          performance: true,
        },
      },
      positions: positionsMapper(config),
      event: {},
      firstPartyData: {},
    };

    if (adsh) {
      benjiConfig.i13n.adsh = adsh;
    }
    if (adBlocker) {
      benjiConfig.i13n.abk = adBlocker;
    }
    if (theme) {
      benjiConfig.i13n.theme = theme;
    }
    if (ynet) {
      benjiConfig.i13n.ynet = ynet;
    }
    // Orion experiment buckets (bsp_<experiment>_<segment>). Always forwarded
    // (even when empty), mirroring aol.com, so segmented users are identifiable
    // in ad impressions.
    benjiConfig.i13n.bucket = buckets;

    var pageKVs = getPageKVs({
      spaceId: spaceId,
      senderDomain: senderDomain,
      senderKaminoLevel1: senderKaminoLevel1,
      senderKaminoLevel2: senderKaminoLevel2,
      plid: plid,
      ver: ver,
      gppHead: gppHead,
      gppSid: gppSid,
      usPrivacy: usPrivacy,
    });
    var pageKVKeys = Object.keys(pageKVs);
    for (var pageKVIndex = 0; pageKVIndex < pageKVKeys.length; pageKVIndex += 1) {
      var pageKVKey = pageKVKeys[pageKVIndex];
      benjiConfig.i13n[pageKVKey] = pageKVs[pageKVKey];
    }

    if (config.perfOffset) {
      benjiConfig.setting.logger = {
        perfOffset: config.perfOffset,
      };
    }

    if (benjiSegmentProviderData.length > 0) {
      benjiConfig.firstPartyData.content = benjiSegmentProviderData;
    }

    return benjiConfig;
  }

  function benjiDestroy(oldPositions, removeContainers) {
    var positions = Array.isArray(oldPositions) ? oldPositions : [];
    var shouldRemoveContainers = removeContainers !== false;
    var divIds = extractDivIds(positions);

    if (window.benji && typeof window.benji.destroy === "function") {
      window.benji.destroy(divIds);
    }

    if (shouldRemoveContainers) {
      removeContainerDivs(positions);
    }
  }

  function benjiRender(renderConfig) {
    var addCollapseSuffix = !parseBoolean(renderConfig.yahooPrebid);
    createContainerDivs(renderConfig.positions || [], addCollapseSuffix);
    var renderPositions = positionsMapper(renderConfig);

    if (window.benji && typeof window.benji.render === "function") {
      window.benji.render(renderPositions);
    }
  }

  function benjiRefresh(positions, options) {
    var opts = options || {};
    var isABPDetected = opts.isABPDetected === true;
    var spaceIdHasChanged = opts.spaceIdHasChanged === true;
    var positionList = Array.isArray(positions) ? positions : [];

    if (isABPDetected) {
      var hasLREC = false;
      var hasLREC4 = false;
      var isRightRail = true;

      for (var index = 0; index < positionList.length; index += 1) {
        var position = positionList[index] || {};
        if (position.div === RIGHT_RAIL_AD_SLOT_ID.LREC) {
          hasLREC = true;
        }
        if (position.div === RIGHT_RAIL_AD_SLOT_ID.LREC4) {
          hasLREC4 = true;
        }
        if (typeof position.adLocation !== "string" || position.adLocation.indexOf(AdLocations.RIGHT_RAIL) !== 0) {
          isRightRail = false;
        }
      }

      if (hasLREC && hasLREC4 && isRightRail && window.benji && typeof window.benji.refresh === "function") {
        if (spaceIdHasChanged) {
          window.benji.refresh([RIGHT_RAIL_AD_SLOT_ID.LREC, RIGHT_RAIL_AD_SLOT_ID.LREC4], { checkViewport: false });
          return;
        }

        window.benji.refresh([RIGHT_RAIL_AD_SLOT_ID.LREC], { checkViewport: false });
        return;
      }
    }

    if (window.benji && typeof window.benji.refresh === "function") {
      window.benji.refresh(BENJI_POSITION_REGION, { checkViewport: false });
    }
  }

  function getAdPositionFromSlotData(div, size, config) {
    var slotKeys = Object.keys(RIGHT_RAIL_AD_SLOT_ID);
    for (var keyIndex = 0; keyIndex < slotKeys.length; keyIndex += 1) {
      var slotKey = slotKeys[keyIndex];
      if (RIGHT_RAIL_AD_SLOT_ID[slotKey] === div) {
        return slotKey;
      }
    }

    if (!Array.isArray(size) || size.length < 2) {
      return null;
    }

    if (size[0] === 0 && size[1] === 0) {
      return DisplayAdPositions.FLUID;
    }

    var allPositionUnits = [];
    var positions = Array.isArray(config.positions) ? config.positions : [];

    for (var positionIndex = 0; positionIndex < positions.length; positionIndex += 1) {
      var position = positions[positionIndex] || {};
      var units = Array.isArray(position.positionUnits) ? position.positionUnits : [];
      for (var unitIndex = 0; unitIndex < units.length; unitIndex += 1) {
        if (allPositionUnits.indexOf(units[unitIndex]) === -1) {
          allPositionUnits.push(units[unitIndex]);
        }
      }
    }

    if (allPositionUnits.length === 0) {
      allPositionUnits = Object.keys(AdSize);
    }

    for (var allUnitIndex = 0; allUnitIndex < allPositionUnits.length; allUnitIndex += 1) {
      var unit = allPositionUnits[allUnitIndex];
      var adSize = AdSize[unit];
      if (!Array.isArray(adSize) || adSize.length < 2) {
        continue;
      }

      if (adSize[0] === size[0] && adSize[1] === size[1]) {
        return unit;
      }
    }

    return null;
  }

  function getPremiumAdHeightFromWidth(width, premiumAdPosition, narrowScreenWidth) {
    var effectiveNarrowScreenWidth = typeof narrowScreenWidth === "number" ? narrowScreenWidth : 1360;

    if (premiumAdPosition === DisplayAdPositions.BILLBOARD) {
      return width >= 970 ? 250 : Math.floor(width / 3.88);
    }

    if (premiumAdPosition === DisplayAdPositions.HORIZON_DESKTOP) {
      var desktopAspectRatio = width > 480 && width < effectiveNarrowScreenWidth ? 4.44 : 5.33;
      return Math.floor(width / desktopAspectRatio);
    }

    if (premiumAdPosition === DisplayAdPositions.HORIZON_MOBILE) {
      return Math.floor(width / 1.78);
    }

    if (premiumAdPosition === DisplayAdPositions.SPOTLIGHT) {
      return Math.floor(width / 0.89);
    }

    if (premiumAdPosition === DisplayAdPositions.MEDIUM_RECTANGLE) {
      return width >= 300 ? 250 : Math.floor(width / 1.2);
    }

    return 0;
  }

  function resizePremiumAd(adPosition, narrowScreenWidth) {
    var slot = document.getElementById(DEFAULT_GPT_DIV);
    if (!slot || !adPosition) {
      return;
    }

    var iframeContainer = slot.children[0];
    var iframe = iframeContainer && iframeContainer.children ? iframeContainer.children[0] : undefined;
    var width = window.innerWidth;
    var height = getPremiumAdHeightFromWidth(window.innerWidth, adPosition, narrowScreenWidth);

    if (adPosition === DisplayAdPositions.MEDIUM_RECTANGLE) {
      slot.style.textAlign = "center";
      return;
    }

    if (adPosition === DisplayAdPositions.LIGHTHOUSE) {
      var viewportHeight = window.innerHeight;
      var lighthouseWidth = viewportHeight / 1.78;

      if (iframeContainer && iframe) {
        iframeContainer.style.height = "100%";
        iframeContainer.style.width = lighthouseWidth + "px";
        iframe.height = String(viewportHeight);
        iframe.width = String(lighthouseWidth);
      }
      slot.style.textAlign = "center";
      return;
    }

    if (iframeContainer && iframe) {
      iframeContainer.style.height = height + "px";
      iframeContainer.style.width = "100%";
      iframe.height = String(height);
      iframe.width = String(width);
    }
  }

  function resizeContainerForLogin(size) {
    var gptContainer = document.getElementById(DEFAULT_GPT_DIV);
    if (!Array.isArray(size) || !gptContainer) {
      return;
    }

    if (size[0] === 0 && size[1] === 0) {
      gptContainer.setAttribute("style", "width:600px;height:1024px;padding-left:200px;padding-right:800px;");
      return;
    }

    if (size[0] === 600 && size[1] === 470) {
      gptContainer.setAttribute("style", "padding-left:138px;padding-top:12px;");
      return;
    }

    gptContainer.setAttribute("style", "width:" + size[0] + "px;height:" + size[1] + "px");
  }

  function resizeForNativeLeaderboard() {
    var slot = document.getElementById(DEFAULT_GPT_DIV);
    if (!slot) {
      return;
    }

    slot.setAttribute("style", "text-align:center");
  }

  function slotRequestedHandler() {
    sendRequestMessage(MESSAGE_NAME_SLOT_REQUESTED);
  }

  function slotResponseReceivedHandler() {
    sendRequestMessage(MESSAGE_NAME_SLOT_RESPONSE_RECEIVED);
  }

  function impressionViewableEventHandler() {
    sendRequestMessage(MESSAGE_NAME_IMPRESSION_VIEWABLE);
  }

  function slotRenderEndedHandler(client) {
    var premiumResizeHandler = null;

    return function (payload) {
      var slotElementId = payload && payload.data ? payload.data.id : undefined;
      var size = payload && payload.data ? payload.data.size : undefined;
      var isEmpty = !payload || payload.name !== BENJI_EVENTS.RENDER_SUCCEEDED;

      var gptEvent = payload && payload.gptEvent ? payload.gptEvent : {};
      var rest = {};
      var gptEventKeys = Object.keys(gptEvent);
      for (var index = 0; index < gptEventKeys.length; index += 1) {
        var key = gptEventKeys[index];
        if (key === "slot" || key === "yieldGroupIds") {
          continue;
        }

        rest[key] = gptEvent[key];
      }

      var config = window._YMIframeConfig || {};
      var position = getAdPositionFromSlotData(slotElementId, size, config);
      var narrowScreenWidth = config.narrowScreenWidth;
      var rightRailAdPositions = [
        DisplayAdPositions.LREC5,
        DisplayAdPositions.LREC4,
        DisplayAdPositions.LREC,
        DisplayAdPositions.MON,
      ];

      if (!isEmpty) {
        if (client === GPT_CLIENTS.LOGIN || client === GPT_CLIENTS.AOL_LOGIN) {
          resizeContainerForLogin(size);
        } else if (
          position === DisplayAdPositions.NATIVE_MOBILE_LEADERBOARD ||
          position === DisplayAdPositions.LEADERBOARD
        ) {
          resizeForNativeLeaderboard();
        } else if (rightRailAdPositions.indexOf(position) !== -1) {
          var slotLREC = document.getElementById(RIGHT_RAIL_AD_SLOT_ID.LREC);
          var slotLREC5 = document.getElementById(RIGHT_RAIL_AD_SLOT_ID.LREC5);
          var slotMON = document.getElementById(RIGHT_RAIL_AD_SLOT_ID.MON);

          if (slotLREC && slotLREC5 && slotMON) {
            var lrec5Top = client === GPT_CLIENTS.NOVATION ? LREC5_TOP_SPACING_NOVATION : LREC5_TOP_SPACING;
            var isMONVisible =
              window.getComputedStyle(slotMON).display !== "none" &&
              window.getComputedStyle(slotLREC).display === "none";
            var newTop = isMONVisible ? "618px" : lrec5Top;

            if (slotLREC5.style && newTop !== slotLREC5.style.top) {
              slotLREC5.style.top = newTop;
            }
          }
        } else if (
          position === DisplayAdPositions.HORIZON_DESKTOP ||
          position === DisplayAdPositions.HORIZON_MOBILE ||
          position === DisplayAdPositions.BILLBOARD ||
          position === DisplayAdPositions.SPOTLIGHT ||
          position === DisplayAdPositions.LIGHTHOUSE ||
          position === DisplayAdPositions.MEDIUM_RECTANGLE
        ) {
          if (premiumResizeHandler) {
            window.removeEventListener("resize", premiumResizeHandler);
          }

          premiumResizeHandler = function () {
            resizePremiumAd(position, narrowScreenWidth);
          };
          premiumResizeHandler();
          window.addEventListener("resize", premiumResizeHandler);
        } else if (premiumResizeHandler) {
          window.removeEventListener("resize", premiumResizeHandler);
          premiumResizeHandler = null;
        }
      }

      var data = {
        position: typeof position === "string" ? position : "",
        isEmpty: isEmpty,
        size: size,
      };

      var restKeys = Object.keys(rest);
      for (var restIndex = 0; restIndex < restKeys.length; restIndex += 1) {
        var restKey = restKeys[restIndex];
        data[restKey] = rest[restKey];
      }

      sendRequestMessage(MESSAGE_NAME_SLOT_RENDER_ENDED, data);
    };
  }

  function initializeBenjiEventHandlers(client) {
    if (!window.benji || typeof window.benji.on !== "function") {
      return;
    }

    window.benji.on(BENJI_EVENTS.SLOT_REQUESTED, slotRequestedHandler);
    window.benji.on(BENJI_EVENTS.RENDER_SUCCEEDED, slotRenderEndedHandler(client));
    window.benji.on(BENJI_EVENTS.RENDER_FAILED, slotRenderEndedHandler(client));
    window.benji.on(BENJI_EVENTS.IMPRESSION_VIEWABLE, impressionViewableEventHandler);
    window.benji.on(BENJI_EVENTS.SLOT_RESPONSE_RECEIVED, slotResponseReceivedHandler);
  }

  function isValidRefreshMessage(event) {
    if (!event || event.source !== window.parent) {
      return false;
    }

    return ALLOWED_DOMAINS_APP_REGEX.test(event.origin) || event.origin === messageTargetOrigin;
  }

  function attachRefreshListener(options) {
    if (refreshListenerAttached) {
      return;
    }

    refreshListenerAttached = true;
    window.addEventListener("message", function (event) {
      if (!isValidRefreshMessage(event)) {
        return;
      }

      var message = event.data;
      if (!message || typeof message !== "object" || message.name !== MESSAGE_NAME_REFRESH) {
        return;
      }

      var data = message.data || {};
      var refreshConfig = data.config || currentConfig;
      var spaceIdHasChanged = data.spaceIdHasChanged === true;
      var contextualSignalsChanged = data.contextualSignalsChanged === true;
      var redefineTargeting = data.redefineTargeting === true;
      var redefinePositionTargeting = data.redefinePositionTargeting === true;
      var targetingConfig = data.targetingConfig || {};
      var spaceId = targetingConfig.spaceId;
      var senderKaminoLevel1 = targetingConfig.senderKaminoLevel1;
      var senderKaminoLevel2 = targetingConfig.senderKaminoLevel2;
      var senderDomain = targetingConfig.senderDomain;
      var plid = targetingConfig.plid;
      var ver = targetingConfig.ver;
      var apuid = targetingConfig.apuid;
      var apuidType = targetingConfig.apuidType;
      var isABPDetected = targetingConfig.adBlocker === ABP_TARGETING_VALUE;

      window._YMIframeConfig = refreshConfig;
      currentConfig = refreshConfig;

      if (refreshConfig && refreshConfig.pageUrl) {
        setPubadsPageUrl(refreshConfig.pageUrl);
      }

      if (redefineTargeting && window.benji && typeof window.benji.updateI13N === "function") {
        var updatedKVs = getPageKVs({
          spaceId: spaceId,
          senderDomain: senderDomain,
          senderKaminoLevel1: senderKaminoLevel1,
          senderKaminoLevel2: senderKaminoLevel2,
          plid: plid,
          ver: ver,
        });
        if (apuid) {
          updatedKVs.apuid = apuid;
        }
        if (apuidType) {
          updatedKVs.apuidtype = apuidType;
        }
        window.benji.updateI13N(updatedKVs);
      }

      var newPositions = Array.isArray(refreshConfig.positions) ? refreshConfig.positions : [];
      var newContextualSignals = refreshConfig.contextualSignals || {};

      if (contextualSignalsChanged && window.benji && typeof window.benji.updateFirstPartyData === "function") {
        window.benji.updateFirstPartyData(getBenjiSegmentProviderData(newContextualSignals), "content");
      }

      var oldPositions = Array.isArray(options.positions) ? options.positions : [];
      var adSizeConfigMismatch = oldPositions.length > 0 && newPositions.length !== oldPositions.length;

      if (adSizeConfigMismatch) {
        benjiDestroy(oldPositions, true);
        benjiRender(refreshConfig);
      } else if (redefinePositionTargeting) {
        benjiDestroy(oldPositions, true);
        var renderConfigWithTargeting = {};
        var refreshConfigKeys = Object.keys(refreshConfig);
        for (var refreshIndex = 0; refreshIndex < refreshConfigKeys.length; refreshIndex += 1) {
          var refreshKey = refreshConfigKeys[refreshIndex];
          renderConfigWithTargeting[refreshKey] = refreshConfig[refreshKey];
        }
        renderConfigWithTargeting.targetingConfig = targetingConfig;
        benjiRender(renderConfigWithTargeting);
      } else {
        benjiRefresh(newPositions, {
          isABPDetected: isABPDetected,
          spaceIdHasChanged: spaceIdHasChanged,
        });
      }
    });
  }

  function runBenji(options) {
    var config = options.config || {};
    var client = options.client || GPT_CLIENTS.MAIL;
    var haqEnabled = options.haqEnabled === true;

    var positions = getAdPositionsFromConfig(config);
    var addCollapseSuffix = !parseBoolean(config.yahooPrebid);

    config.positions = positions;
    window._YMIframeConfig = config;
    currentConfig = config;
    messageTargetOrigin = getTargetOrigin(config.pageUrl);

    setPubadsPageUrl(config.pageUrl);

    sendRequestMessage(MESSAGE_NAME_LOADED);

    createContainerDivs(config.positions, addCollapseSuffix);

    var benjiConfig = getBenjiConfig({
      config: config,
      client: client,
      haqEnabled: haqEnabled,
    });

    if (typeof window.benji !== "undefined" && typeof window.benji.start === "function") {
      window.benji.start(benjiConfig);
    } else {
      window.benji = { benjiConfig: benjiConfig };
    }

    if (window.benji && window.benji.isReady) {
      initializeBenjiEventHandlers(client);
    } else {
      window.addEventListener("benji:ready", function () {
        initializeBenjiEventHandlers(client);
      });
    }

    attachRefreshListener({ positions: positions });
  }

  function init() {
    window.googletag = window.googletag || { cmd: [] };

    var parsedQuery = parseQuery(window.location.search || "");
    var client = parsedQuery.client || GPT_CLIENTS.MAIL;
    var haqEnabled = parsedQuery.haq === "1";
    cachedClient = client;

    var hash = window.location.hash ? window.location.hash.substring(1) : "";
    if (!hash) {
      sendInitError("Config hash is empty", parsedQuery.ymreqid);
      return;
    }

    var config = parseConfigFromHash();
    var ymreqid = (config && config.ymreqid) || parsedQuery.ymreqid;
    if (!config) {
      sendInitError("Failed to parse config", ymreqid);
      return;
    }

    currentConfig = config;
    window._YMIframeConfig = config;

    try {
      runBenji({
        config: config,
        client: cachedClient,
        haqEnabled: haqEnabled,
      });
    } catch (error) {
      sendInitError(error && error.message ? error.message : "Failed to start Benji", ymreqid);
    }
  }

  init();
})();
