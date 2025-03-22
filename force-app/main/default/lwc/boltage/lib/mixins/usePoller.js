import { refreshApex } from '@salesforce/apex';
/**
 * @param {Constructor<any>} genericConstructor
 * @param {{resolveCondition: [Function, string] | string | Function, wiredMethod: string, maxIteration: number | Function, interval: number | Function}} params
 * @returns {Constructor<any>}
 */
export const usePoller = ({resolveCondition, wiredMethod, maxIteration, interval}) => clazz =>
  class extends clazz {
    __POLLER_MXN_INTERVAL__;
    POLLER_PROGRESS = 0;
    POLLER_ITTERATION = 0;

    initPoller() {
      let triggerProp = resolveCondition;
      let _interval = typeof interval === 'function' ? interval(this) : interval;
      let _maxIteration = typeof maxIteration === 'function' ? maxIteration(this) : maxIteration;

      this.__POLLER_MXN_INTERVAL__ = window.setInterval(() => {
        this.POLLER_ITTERATION ++;
        this.POLLER_PROGRESS += Math.round(100 / _maxIteration);

        if(this?.[wiredMethod]?.error)
          this.pollingHasEnded('ERR');

        switch(true) {
          case resolveCondition instanceof Array:
            const [fun, _prop] = resolveCondition;
            if(fun(this?.[wiredMethod]?.data?.at(0)?.[_prop]))
              this.pollingHasEnded('OK');
            break;

          case typeof resolveCondition === 'function':
            if(resolveCondition(this?.[wiredMethod]?.data?.at(0)))
              this.pollingHasEnded('OK');
            break;

          default:
            if(this?.[wiredMethod]?.data?.at(0)?.[triggerProp])
              this.pollingHasEnded('OK');
            break;
        }

        if(this.POLLER_ITTERATION === _maxIteration)
          this.pollingHasEnded('POLLING_LIMIT_EXCEEDED');

        refreshApex(this?.[wiredMethod]);
      }, _interval);
    }
    pollingHasEnded(status) {
      this.POLLER_PROGRESS = 100;
      window.clearInterval(this.__POLLER_MXN_INTERVAL__);
      const detail = {
        response: status === 'OK' ? this?.[wiredMethod]?.data?.at(0) : undefined,
        error: status === 'ERR' ? this?.[wiredMethod]?.error : undefined,
        status
      }
      // First checks if consumer class has implemented pollerEndedCallback() else defaults to send to legacy event
      if(this.pollerEndedCallback) {
        this.pollerEndedCallback(detail);
      } else {
        this.template.dispatchEvent(
          new CustomEvent('polling-end', {
            detail
          })
        );
      }
    }
  }