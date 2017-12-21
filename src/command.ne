@preprocessor typescript

@{%
import { CommandType } from './parser'
import * as moo from 'moo'

const lexer = moo.compile({
  space: / +/,
  address: /0x[0-9a-fA-F]{40}/,
  username: /@[0-9a-zA-Z_]{1,15}/,
  number: /(?:[1-9][0-9]*|0)(?:\.[0-9]+)?/,
  eth: /(?:ETH|eth)/,
  wei: /(?:Wei|wei)/,
  command: ['tip', 'withdraw', 'deposit', 'balance', 'help'],
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

TipCommand -> __ "tip" __ Username {% d => ({ type: CommandType.TIP, username: d[3] }) %}
            | TipCommand _ Amount {% d => Object.assign(d[0], d[2]) %}

WithdrawCommand -> __ "withdraw" __ Amount __ Address  {% d => Object.assign({ type: CommandType.WITHDRAW, address: d[5] }, d[3]) %}

DepositCommand -> __ "deposit" {% d => ({ type: CommandType.DEPOSIT }) %}

BalanceCommand -> __ "balance" {% d => ({ type: CommandType.BALANCE }) %}

HelpCommand -> __ "help" {% d => ({ type: CommandType.HELP }) %}

Amount -> Number _ Symbol {% d => ({ amount: d[0], symbol: d[2] }) %}

Symbol -> %eth {% d => 'ETH' %}
        | %wei {% d => 'Wei' %}

Address -> %address {% d => d[0].value %}

Username -> %username {% d => d[0].value.slice(1) %}

Number -> %number {% d => parseFloat(d[0].value) %}

Any -> %any {% d => d[0].value %}

_ -> %space:? {% d => null %}

__ -> %space {% d => null %}
