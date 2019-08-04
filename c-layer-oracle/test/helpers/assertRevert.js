
/**
 * @author Cyril Lapinte - <cyril@openfiz.com>
 */

module.exports = async function (promise, expectedReasonOrCode) {
  try {
    await promise;
    assert.fail("Expected revert not received");
  } catch (error) {
    if (typeof error == "object") {
      if (Object.keys(error).length > 0) {
        const revertReasonFound =
          (error.reason && error.reason === expectedReasonOrCode) ||
            (error.code && error.code === expectedReasonOrCode);

        if (!revertReasonFound || !expectedReasonOrCode) {
          console.error(JSON.stringify(error));
        }
        assert(revertReasonFound,
          "Expected 'revert', got reason=" + error.reason + " and code=" + error.code + " instead!");
      } else {
        const errorStr = error.toString();
        const revertReasonFound = errorStr.indexOf("revert " + expectedReasonOrCode);
        assert(revertReasonFound, "Expected 'revert " + expectedReasonOrCode + "', got '" + errorStr + "'!");
      }
    } else {
      assert(false, "Invalid error format. Revert not found '" + error + "'!");
    }
  }
};