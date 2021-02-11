export function singleShotWaitForEvent(object, event) {
  return new Promise(resolve => {
    var listener = () => {
      object.removeEventListener(event, listener);
      resolve();
    };
    object.addEventListener(event, listener);
  });
}

export class StatEstimator {
  constructor(maxHistory) {
    this.maxHistory = maxHistory;
    this._start = undefined;
    this._nextStart = undefined;
    this._end = undefined;
  }

  reset() {
    this._start = undefined;
    this._nextStart = undefined;
    this._end = undefined;
  }

  add(value, timestamp) {
    if (this._start == undefined) {
      this._start = [timestamp, value];
      return undefined;
    }

    this._end = [timestamp, value];
    let interval = this._end[0] - this._start[0];
    let count = this._end[1] - this._start[1];
    let estimate = (1000 * count) / interval;

    if (interval >= this.maxHistory / 5 && this._nextStart === undefined) {
      this._nextStart = [timestamp, value];
    }

    if (interval >= this.maxHistory) {
      this._start = this._nextStart;
      this._nextStart = undefined;
    }

    return estimate;
  }
}
