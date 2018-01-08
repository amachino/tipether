@preprocessor typescript

@{%
import { CommandType } from './parser'
import * as moo from 'moo'

const lexer = moo.compile({
  space: / +/,
  ens: /[0-9a-zA-Z-]+\.eth/,
  address: /0x[0-9a-fA-F]{40}/,
  username: /@[0-9a-zA-Z_]{1,15}/,
  number: /(?:[1-9][0-9]*|0)(?:\.[0-9]+)?/,
  eth: /[eE]ther|ETH|[eE]th/,
  tip: /[tT]ip/,
  withdraw: /[wW]ithdraw/,
  deposit: /[dD]eposit/,
  balance: /[bB]alance/,
  help: /[hH]elp/,
  any: /.+/
})
%}

@lexer lexer

Main -> AnyCommand _ {% d => d[0] %}
      | AnyCommand __ Any {% d => d[0] %}

AnyCommand -> TipCommand {% id %}
            | WithdrawCommand {% id %}
            | BalanceCommand {% id %}
            | DepositCommand {% id %}
            | HelpCommand {% id %}

TipCommand -> _ %tip __ Username {% d => ({ type: CommandType.TIP, username: d[3] }) %}
            | TipCommand _ Amount {% d => Object.assign(d[0], d[2]) %}

WithdrawCommand -> _ %withdraw __ Amount __ AddressOrENS  {% d => Object.assign({ type: CommandType.WITHDRAW, address: d[5] }, d[3]) %}

DepositCommand -> _ %deposit {% d => ({ type: CommandType.DEPOSIT }) %}

BalanceCommand -> _ %balance {% d => ({ type: CommandType.BALANCE }) %}

HelpCommand -> _ %help {% d => ({ type: CommandType.HELP }) %}

Amount -> Number _ Symbol {% d => ({ amount: d[0], symbol: d[2] }) %}

Symbol -> %eth {% d => 'ETH' %}

AddressOrENS -> Address {% id %}
              | ENS {% id %}

Address -> %address {% d => d[0].value %}

ENS -> %ens {% d => d[0].value %}

Username -> %username {% d => d[0].value.slice(1) %}

Number -> %number {% d => parseFloat(d[0].value) %}

Any -> %any {% d => d[0].value %}

_ -> %space:? {% d => null %}

__ -> %space {% d => null %}
