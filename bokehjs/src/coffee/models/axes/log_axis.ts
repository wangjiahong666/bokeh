import {AxisView} from "./axis"
import {ContinuousAxis} from "./continuous_axis"
import {LogTickFormatter} from "../formatters/log_tick_formatter"
import {LogTicker} from "../tickers/log_ticker"

export class LogAxisView extends AxisView {
  model: LogAxis
}

export namespace LogAxis {
  export interface Attrs extends ContinuousAxis.Attrs {
    ticker:    LogTicker
    formatter: LogTickFormatter
  }
}

export interface LogAxis extends ContinuousAxis, LogAxis.Attrs {}

export class LogAxis extends ContinuousAxis {

  static initClass() {
    this.prototype.type = "LogAxis"
    this.prototype.default_view = LogAxisView

    this.override({
      ticker:    () => new LogTicker(),
      formatter: () => new LogTickFormatter(),
    })
  }
}
LogAxis.initClass()
