/**
 * Open original file in VLC from the Plex web interface
 *
 * This project is licensed under the terms of the MIT license, see https://banrobert.github.io/plex-open-in-vlc/LICENSE.txt
 *
 * @author      Pip Longrun <pip.longrun@protonmail.com>
 * @author      Robert Ban <banrobert@gmail.com>
 * @version     0.4
 * @see         https://banrobert.github.io/plex-open-in-vlc/
 *
 */
"use strict";

if (typeof openInVlc === "undefined") {
  window.openInVlc = (function () {
    const clientIdRegex = new RegExp("server/([a-f0-9]{40})/");
    const metadataIdRegex = new RegExp("key=%2Flibrary%2Fmetadata%2F(\\d+)");
    const apiResourceUrl = "https://plex.tv/api/resources?includeHttps=1&X-Plex-Token={token}";
    const apiLibraryUrl = "{baseuri}/library/metadata/{id}?X-Plex-Token={token}";
    const downloadUrl = "{baseuri}{partkey}?download=1&X-Plex-Token={token}";
    const accessTokenXpath = "//Device[@clientIdentifier='{clientid}']/@accessToken";
    const baseUriXpath = "//Device[@clientIdentifier='{clientid}']/Connection[@local='0']/@uri";
    const partKeyXpath = "//Media/Part[1]/@key";
    let accessToken = null;
    let baseUri = null;

    const getXml = function (url, callback) {
      const request = new XMLHttpRequest();
      request.onreadystatechange = function () {
        if (request.readyState == 4 && request.status == 200) {
          callback(request.responseXML);
        }
      };
      request.open("GET", url);
      request.send();
    };

    const openUrl = function (xml) {
      const partKeyNode = xml.evaluate(partKeyXpath, xml, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);

      if (partKeyNode.singleNodeValue) {
        //window.location.href =
          //"vlc://" +
        copyToClipboard(
          downloadUrl
            .replace("{baseuri}", baseUri)
            .replace("{partkey}", partKeyNode.singleNodeValue.textContent)
            .replace("{token}", accessToken)
        );
      } else {
        alert("You are currently not viewing a media item.");
      }
    };
    function copyToClipboard(text) {
        var dummy = document.createElement("textarea");
        // to avoid breaking orgain page when copying more words
        // cant copy when adding below this code
        // dummy.style.display = 'none'
        document.body.appendChild(dummy);
        //Be careful if you use texarea. setAttribute('value', value), which works with "input" does not work with "textarea". – Eduard
        dummy.value = text;
        dummy.select();
        document.execCommand("copy");
        document.body.removeChild(dummy);
    }
    const getMetadata = function (xml) {
      const clientId = clientIdRegex.exec(window.location.href);

      if (clientId && clientId.length == 2) {
        const accessTokenNode = xml.evaluate(
          accessTokenXpath.replace("{clientid}", clientId[1]),
          xml,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        );
        const baseUriNode = xml.evaluate(
          baseUriXpath.replace("{clientid}", clientId[1]),
          xml,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        );

        if (accessTokenNode.singleNodeValue && baseUriNode.singleNodeValue) {
          accessToken = accessTokenNode.singleNodeValue.textContent;
          baseUri = baseUriNode.singleNodeValue.textContent;
          const metadataId = metadataIdRegex.exec(window.location.href);

          if (metadataId && metadataId.length == 2) {
            getXml(
              apiLibraryUrl
                .replace("{baseuri}", baseUri)
                .replace("{id}", metadataId[1])
                .replace("{token}", accessToken),
              openUrl
            );
          } else {
            alert("You are currently not viewing a media item.");
          }
        } else {
          alert("Cannot find a valid accessToken.");
        }
      } else {
        alert("You are currently not viewing a media item.");
      }
    };

    return function () {
      if (typeof localStorage.myPlexAccessToken != "undefined") {
        getXml(apiResourceUrl.replace("{token}", localStorage.myPlexAccessToken), getMetadata);
      } else {
        alert("You are currently not browsing or logged into a Plex web environment.");
      }
    };
  })();
}

openInVlc();
