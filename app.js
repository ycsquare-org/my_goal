const K="my-goal-tracking-v5",LEGACY_K="my-goal-tracking-v4",$=s=>document.querySelector(s);
let state=load(),selected=null,timer;

const id=()=>globalThis.crypto?.randomUUID?crypto.randomUUID():Date.now()+"-"+Math.random();
const today=()=>new Date().toISOString().slice(0,10);
const date=v=>new Intl.DateTimeFormat("zh-CN",{year:"numeric",month:"long",day:"numeric"}).format(new Date(v+"T00:00:00"));
const esc=v=>{const e=document.createElement("div");e.textContent=String(v??"");return e.innerHTML};

function normalize(raw={}){
  const oldFriends=Array.isArray(raw.friends)?raw.friends:[];
  const familyMembers=Array.isArray(raw.familyMembers)?raw.familyMembers:oldFriends.map(name=>({id:id(),name,publicGoals:[]}));
  const goals=Array.isArray(raw.goals)?raw.goals.map(g=>({
    ...g,
    person:g.person||"",
    familyVisible:Boolean(g.familyVisible),
    steps:Array.isArray(g.steps)?g.steps.map(s=>({
      ...s,
      reminder:{enabled:Boolean(s.reminder?.enabled),time:s.reminder?.time||"18:30",lastShown:s.reminder?.lastShown||""},
      coinValue:Number(s.coinValue)||5,
      rewardGranted:Boolean(s.rewardGranted)
    })):[]
  })):[];
  return{
    goals,
    familyMembers,
    wallet:{coins:Number(raw.wallet?.coins)||0},
    rewards:Array.isArray(raw.rewards)&&raw.rewards.length?raw.rewards:[
      {id:id(),name:"选择今晚的家庭电影",cost:20,redeemed:0},
      {id:id(),name:"周末特别活动一次",cost:50,redeemed:0}
    ]
  };
}

function load(){
  try{
    const current=localStorage.getItem(K),legacy=localStorage.getItem(LEGACY_K),raw=JSON.parse(current||legacy||"null");
    if(raw?.goals)return normalize(raw);
  }catch(_){}
  return normalize({goals:[],familyMembers:[{id:id(),name:"妈妈",publicGoals:[]},{id:id(),name:"爸爸",publicGoals:[]}]});
}

function save(){localStorage.setItem(K,JSON.stringify(state))}
function goal(){return state.goals.find(x=>x.id===selected)}
function percent(x){return x.steps.length?Math.round(x.steps.filter(s=>s.done).length/x.steps.length*100):0}
function toast(message){$("#toast").textContent=message;$("#toast").classList.add("visible");clearTimeout(timer);timer=setTimeout(()=>$("#toast").classList.remove("visible"),3200)}

function smartStepNames(title){
  const q=`「${title}」`,low=title.toLowerCase();
  if(/旅行|旅游|出国|城市|露营|游学/.test(low))return[
    `确认${q}的目的地、同行人、天数与完成标准`,
    `为${q}查清交通、住宿和每日路线`,
    `列出${q}的预算，并确认需要准备的金额`,
    `核对${q}所需证件、预约和安全信息`,
    `完成${q}的关键预订，并保存确认信息`,
    `整理${q}的行李清单与出发前检查表`
  ];
  if(/读|书|阅读|小说|绘本/.test(low))return[
    `确认${q}的书目、总页数和读完标准`,
    `把${q}拆成每周阅读页数并安排固定时段`,
    `完成${q}的前 25%，记录一个关键观点`,
    `完成${q}的一半，并向家人复述主要内容`,
    `读完${q}剩余内容，标记最有感触的段落`,
    `为${q}写一份简短读后感或分享卡`
  ];
  if(/跑|运动|健身|游泳|球|马拉松|骑行|体能/.test(low))return[
    `记录完成${q}需要达到的距离、时长或次数`,
    `测试当前水平，为${q}确定安全的起点`,
    `安排与${q}匹配的每周训练日和休息日`,
    `完成${q}的第一次完整训练并记录感受`,
    `完成一次${q}的阶段测试，再调整训练量`,
    `进行${q}的正式挑战并记录最终结果`
  ];
  if(/学|考试|英语|数学|语言|课程|成绩|背|单词/.test(low))return[
    `列出${q}必须掌握的知识点和可验证标准`,
    `为${q}收集教材、练习题和反馈渠道`,
    `完成${q}的第一轮重点学习与练习`,
    `做一次与${q}对应的模拟测试并整理错题`,
    `针对${q}的薄弱点完成第二轮专项练习`,
    `进行${q}的最终模拟，并复盘仍需加强的内容`
  ];
  if(/画|写|设计|作品|视频|摄影|创作|手工/.test(low))return[
    `明确${q}的主题、受众和最终作品形式`,
    `为${q}收集参考并完成素材清单`,
    `画出或写出${q}的第一版结构草稿`,
    `完成${q}最核心部分的可展示初稿`,
    `邀请一位家人或伙伴对${q}给出具体反馈`,
    `根据反馈完成${q}的定稿并整理展示版本`
  ];
  if(/存|攒|买|预算|省钱/.test(low))return[
    `确认${q}需要的准确金额和截止日期`,
    `盘点现有金额，算出${q}还差多少`,
    `把${q}拆成每周或每月储蓄额度`,
    `为${q}找出三项可以减少的非必要支出`,
    `完成${q}的中期金额检查并修正计划`,
    `达到${q}所需金额并完成最终确认`
  ];
  if(/琴|音乐|舞|唱|演出|表演/.test(low))return[
    `确认${q}的曲目、动作或最终展示标准`,
    `把${q}拆成需要分别练习的段落`,
    `完成${q}第一段的慢速准确练习`,
    `连贯完成${q}并录下第一次完整版本`,
    `根据录音或家人反馈修正${q}的三个问题`,
    `完成${q}的正式展示或最终录制`
  ];
  return[
    `写清${q}完成时必须看得见的成果`,
    `列出完成${q}所需的资料、工具和帮助`,
    `把${q}拆出第一个 30 分钟内能完成的动作`,
    `完成${q}的第一个可展示成果并保存记录`,
    `请一位家人或伙伴检查${q}的阶段成果`,
    `根据反馈完成${q}并做一次结果复盘`
  ];
}

function suggested(title,deadline){
  const names=smartStepNames(title),start=+new Date(today()+"T00:00:00"),end=Math.max(start,+new Date(deadline+"T00:00:00"));
  return names.map((name,i)=>({
    id:id(),name,date:new Date(start+(end-start)*(i+1)/names.length).toISOString().slice(0,10),done:false,
    reminder:{enabled:false,time:"18:30",lastShown:""},coinValue:5,rewardGranted:false
  }));
}

function newGoal(title,deadline){return{id:id(),title,date:deadline,person:"",familyVisible:false,steps:suggested(title,deadline)}}

function renderGoals(){
  $("#goal-list").innerHTML=state.goals.map(x=>{const p=percent(x);return `<button class="goal" type="button" data-id="${x.id}"><small>预计完成 · ${date(x.date)} ${x.familyVisible?'· 家庭圈可见':''}</small><h3>${esc(x.title)}</h3><div class="goal-footer"><i class="mini" style="--progress:${p}%"></i><b>${p}% 已完成</b>&nbsp;·&nbsp;${x.steps.filter(s=>s.done).length}/${x.steps.length} 项</div></button>`}).join("");
  $("#goal-count").textContent=state.goals.length?state.goals.length+" 个目标":"";
  $("#empty-state").hidden=Boolean(state.goals.length);
}

function renderPlan(){
  const x=goal(),section=$("#plan-section");
  if(!x){section.hidden=true;return}
  section.hidden=false;
  const p=percent(x);
  $("#plan-title").textContent=x.title;
  $("#plan-meta").textContent=`预计在 ${date(x.date)} 前完成${x.person?" · 与 "+x.person+" 关联":""}`;
  $("#visibility-badge").textContent=x.familyVisible?"◉ 家庭圈可见":"🔒 仅自己可见";
  $("#visibility-badge").classList.toggle("shared",x.familyVisible);
  $("#progress-number").textContent=p+"%";
  $("#progress-ring").style.setProperty("--progress",p+"%");
  $("#timeline").innerHTML=x.steps.map((s,i)=>{
    const reminder=s.reminder?.enabled?`<span class="reminder-badge">🔔 ${esc(s.reminder.time)}</span>`:`<span class="muted-badge">不提醒</span>`;
    return `<li class="step ${s.done?"done":""}"><label><input type="checkbox" data-check="${s.id}" ${s.done?"checked":""}><span>第 ${i+1} 步：${esc(s.name)}</span></label><time>${date(s.date)}</time><div class="step-meta">${reminder}<span class="coin-badge">★ ${s.rewardGranted?'已获得':s.coinValue+' 枚'}</span></div><div class="item-actions"><button class="text" type="button" data-edit="${s.id}">编辑事项与提醒</button><button class="text" type="button" data-remove="${s.id}">移除</button></div></li>`;
  }).join("");
}

function support(){
  const x=state.goals[0],next=x?.steps.find(s=>!s.done);
  $("#encouragement-title").textContent=x?`为「${x.title}」加油`:"等待一个目标";
  $("#encouragement-text").textContent=next?`我看见你正在完成「${next.name}」。不需要一次做完，我愿意陪你把这一步走完。`:x?"你已经完成了所有小事项。现在，值得好好庆祝这份坚持。":"当孩子写下目标，这里会生成一段合适的鼓励。";
}

function renderFamily(){
  const select=$("#detail-person"),old=select.value;
  select.innerHTML='<option value="">暂不关联</option>'+state.familyMembers.map(m=>`<option value="${esc(m.name)}">${esc(m.name)}</option>`).join("");
  select.value=old;
  $("#member-list").innerHTML=state.familyMembers.length?state.familyMembers.map(m=>`<span class="member-chip"><i>${esc(m.name.slice(0,1))}</i>${esc(m.name)}</span>`).join(""):'<p class="empty-copy">还没有家庭成员。</p>';
  const mine=state.goals.filter(g=>g.familyVisible).map(g=>({owner:"我",title:g.title,progress:percent(g),date:g.date}));
  const theirs=state.familyMembers.flatMap(m=>(m.publicGoals||[]).map(title=>({owner:m.name,title,progress:null,date:null})));
  const feed=[...mine,...theirs];
  $("#family-feed").innerHTML=feed.length?feed.map(item=>`<article class="feed-card"><span class="avatar">${esc(item.owner.slice(0,1))}</span><div><small>${esc(item.owner)}公开了目标</small><h3>${esc(item.title)}</h3>${item.progress===null?'<p>对方只开放了目标名称</p>':`<p>${item.progress}% 已完成 · 预计 ${date(item.date)}</p>`}</div></article>`).join(""):'<div class="empty-feed">还没有公开目标。你可以在“编辑目标信息”中选择一个目标与家人分享。</div>';
}

function renderRewards(){
  $("#header-coins").textContent=state.wallet.coins;
  $("#wallet-coins").textContent=state.wallet.coins;
  $("#reward-list").innerHTML=state.rewards.length?state.rewards.map(r=>`<article class="reward-card"><div><small>已兑换 ${r.redeemed||0} 次</small><h3>${esc(r.name)}</h3></div><strong>★ ${r.cost}</strong><div><button class="primary compact" type="button" data-redeem="${r.id}" ${state.wallet.coins<r.cost?'disabled':''}>兑换</button><button class="text compact" type="button" data-remove-reward="${r.id}">删除</button></div></article>`).join(""):'<p class="empty-copy">家长还没有设置兑换奖励。</p>';
}

function render(){renderGoals();renderPlan();support();renderFamily();renderRewards()}
function showHome(){selected=null;$("#home-panels").hidden=false;$("#more-panel").hidden=true;$("#plan-section").hidden=true;document.querySelectorAll(".nav-link").forEach(n=>n.classList.toggle("active",n.dataset.view==="home"))}
function openPlan(goalId){selected=goalId;$("#home-panels").hidden=true;$("#more-panel").hidden=true;renderPlan();$("#plan-section").scrollIntoView({behavior:"smooth",block:"start"})}
function copy(text,ok="文案已复制。"){navigator.clipboard?.writeText(text).then(()=>toast(ok)).catch(()=>toast("复制失败，请手动复制。"))}

function fillGoalDialog(x){
  $("#detail-title").value=x.title;$("#detail-date").value=x.date;$("#detail-person").value=x.person||"";$("#detail-visible").checked=Boolean(x.familyVisible);$("#details-message").textContent="";
}

function openStepDialog(step=null){
  const x=goal();$("#step-form").reset();$("#step-id").value=step?.id||"";$("#step-name").value=step?.name||"";$("#step-date").value=step?.date||x?.date||today();$("#step-reminder").checked=Boolean(step?.reminder?.enabled);$("#step-reminder-time").value=step?.reminder?.time||"18:30";$("#reminder-time-field").hidden=!$("#step-reminder").checked;$("#step-dialog-title").textContent=step?"编辑小事项":"添加小事项";$("#step-submit").textContent=step?"保存事项":"添加到时间线";$("#step-message").textContent="";$("#step-dialog").showModal();$("#step-name").focus();
}

$("#goal-form").onsubmit=e=>{
  e.preventDefault();const d=Object.fromEntries(new FormData(e.currentTarget));
  if(!d.title.trim()||!d.date){$("#goal-message").textContent="请写下目标和预计完成时间。";return}
  if(d.date<today()){$("#goal-message").textContent="完成日期需要是今天或之后。";return}
  const x=newGoal(d.title.trim(),d.date);state.goals.unshift(x);selected=x.id;save();e.currentTarget.reset();$("#goal-message").textContent="";$("#home-panels").hidden=true;render();fillGoalDialog(x);$("#goal-dialog").showModal();toast(`已围绕「${x.title}」生成 ${x.steps.length} 个相关事项。`);
};

$("#goal-list").onclick=e=>{const b=e.target.closest("[data-id]");if(b)openPlan(b.dataset.id)};
$("#back-to-list").onclick=()=>{showHome();document.querySelector(".goals").scrollIntoView({behavior:"smooth"})};
$("#back-home").onclick=showHome;

$("#timeline").onclick=e=>{
  const x=goal(),key=e.target.dataset.check||e.target.dataset.edit||e.target.dataset.remove,step=x?.steps.find(v=>v.id===key);if(!step)return;
  if(e.target.dataset.check){
    step.done=e.target.checked;
    if(step.done&&!step.rewardGranted){step.rewardGranted=true;state.wallet.coins+=step.coinValue||5;toast(`完成一小步，获得 ${step.coinValue||5} 枚星星币！`)}else toast(step.done?"这一步已完成，星星币此前已经领取。":"已恢复为待完成，获得过的星星币会保留。");
  }
  if(e.target.dataset.edit){openStepDialog(step);return}
  if(e.target.dataset.remove&&confirm(`移除「${step.name}」吗？`)){x.steps=x.steps.filter(v=>v!==step);toast("小事项已移除，已经获得的星星币会保留。")}
  save();render();
};

$("#add-step").onclick=()=>openStepDialog();
$("#step-reminder").onchange=e=>{$("#reminder-time-field").hidden=!e.target.checked};
$("#close-step-dialog").onclick=()=>$("#step-dialog").close();
$("#step-form").onsubmit=e=>{
  e.preventDefault();const d=Object.fromEntries(new FormData(e.currentTarget)),x=goal();
  if(!d.name.trim()||!d.date){$("#step-message").textContent="请填写事项和日期。";return}
  const values={name:d.name.trim(),date:d.date,reminder:{enabled:$("#step-reminder").checked,time:d.reminderTime||"18:30",lastShown:""}};
  const existing=x.steps.find(s=>s.id===d.id);
  if(existing)Object.assign(existing,values);else x.steps.push({id:id(),...values,done:false,coinValue:5,rewardGranted:false});
  save();$("#step-dialog").close();render();toast(existing?"事项和提醒已更新。":"已添加到时间线。");
};

$("#edit-goal").onclick=()=>{const x=goal();if(!x)return;fillGoalDialog(x);$("#goal-dialog").showModal()};
$("#close-goal-dialog").onclick=()=>$("#goal-dialog").close();
$("#details-form").onsubmit=e=>{
  e.preventDefault();const d=Object.fromEntries(new FormData(e.currentTarget));
  if(!d.title.trim()||!d.date){$("#details-message").textContent="目标和完成日期不能为空。";return}
  Object.assign(goal(),{title:d.title.trim(),date:d.date,person:d.person.trim(),familyVisible:$("#detail-visible").checked});save();$("#goal-dialog").close();render();toast(goal().familyVisible?"目标已保存，并对家庭圈可见。":"目标已保存，仅自己可见。");
};

$("#share-goal").onclick=()=>{const x=goal(),next=x.steps.find(s=>!s.done);copy(`我正在完成「${x.title}」\n预计完成：${date(x.date)}\n当前进度：${percent(x)}%\n下一步：${next?next.name:"庆祝完成"}\n\n来自「晨星」`)};
$("#export-goal").onclick=()=>{const x=goal(),report=["我的目标进度",`目标：${x.title}`,`完成日期：${date(x.date)}`,`进度：${percent(x)}%`,`星星币：${state.wallet.coins}`,"",...x.steps.map(s=>`${s.done?"✓":"○"} ${s.name}（${date(s.date)}）${s.reminder?.enabled?` · 提醒 ${s.reminder.time}`:""}`)].join("\n"),a=document.createElement("a");a.href=URL.createObjectURL(new Blob([report],{type:"text/plain;charset=utf-8"}));a.download=x.title+"-进度.txt";a.click();URL.revokeObjectURL(a.href);toast("进度文件已导出。")};
$("#header-share").onclick=()=>copy(location.href,"页面链接已复制。");
$("#copy-encouragement").onclick=()=>copy($("#encouragement-text").textContent);

$("#family-form").onsubmit=e=>{
  e.preventDefault();const d=Object.fromEntries(new FormData(e.currentTarget)),name=d.name.trim(),publicGoal=d.goal.trim();
  if(!name){$("#family-status").textContent="请输入家庭成员名字。";return}
  let member=state.familyMembers.find(m=>m.name===name);
  if(!member){member={id:id(),name,publicGoals:[]};state.familyMembers.push(member)}
  if(publicGoal&&!member.publicGoals.includes(publicGoal))member.publicGoals.push(publicGoal);
  save();e.currentTarget.reset();$("#family-status").textContent=`${name} 已加入家庭圈${publicGoal?"，公开目标已显示。":"。"}`;render();toast("家庭圈已更新。");
};

$("#reward-form").onsubmit=e=>{
  e.preventDefault();const d=Object.fromEntries(new FormData(e.currentTarget)),name=d.name.trim(),cost=Number(d.cost);
  if(!name||!Number.isInteger(cost)||cost<1){$("#reward-status").textContent="请填写奖励内容和有效币值。";return}
  state.rewards.unshift({id:id(),name,cost,redeemed:0});save();e.currentTarget.reset();$("#reward-cost").value=20;$("#reward-status").textContent=`已添加「${name}」，需要 ${cost} 枚星星币。`;renderRewards();toast("兑换规则已添加。");
};

$("#reward-list").onclick=e=>{
  const redeem=e.target.dataset.redeem,remove=e.target.dataset.removeReward,reward=state.rewards.find(r=>r.id===(redeem||remove));if(!reward)return;
  if(redeem){if(state.wallet.coins<reward.cost){toast("星星币还不够，继续完成小事项吧。");return}state.wallet.coins-=reward.cost;reward.redeemed=(reward.redeemed||0)+1;toast(`已兑换「${reward.name}」，请家长来确认兑现。`)}
  if(remove&&confirm(`删除兑换规则「${reward.name}」吗？`))state.rewards=state.rewards.filter(r=>r!==reward);
  save();renderRewards();
};

function openAuth(mode){$("#auth-form").reset();$("#auth-title").textContent=mode==="signup"?"注册晨星":"登录晨星";$("#auth-submit").textContent=mode==="signup"?"注册":"登录";$("#auth-form").dataset.mode=mode;$("#auth-message").textContent="";$("#auth-dialog").showModal();$("#auth-email").focus()}
$("#login-open").onclick=()=>openAuth("login");
$("#signup-open").onclick=()=>openAuth("signup");
$("#close-auth-dialog").onclick=()=>$("#auth-dialog").close();
$("#auth-form").onsubmit=e=>{e.preventDefault();$("#auth-message").textContent="演示版入口已准备好；接入账户服务后可在不同设备同步家庭圈。"};

document.querySelectorAll(".nav-link").forEach(button=>button.onclick=()=>{
  const view=button.dataset.view;document.querySelectorAll(".nav-link").forEach(n=>n.classList.toggle("active",n===button));
  if(view==="home"){showHome();return}
  selected=null;$("#home-panels").hidden=true;$("#plan-section").hidden=true;$("#more-panel").hidden=false;$("#family-content").hidden=view!=="family";$("#rewards-content").hidden=view!=="rewards";$("#more-panel").scrollIntoView({behavior:"smooth",block:"start"});
});

function checkReminders(){
  const now=new Date(),day=today(),time=now.toTimeString().slice(0,5),due=[];
  state.goals.forEach(g=>g.steps.forEach(s=>{if(!s.done&&s.date===day&&s.reminder?.enabled&&s.reminder.time===time&&s.reminder.lastShown!==day){s.reminder.lastShown=day;due.push(s.name)}}));
  if(due.length){save();toast(due.length===1?`事项提醒：${due[0]}`:`有 ${due.length} 个小事项到提醒时间了。`)}
}

setInterval(checkReminders,30000);
checkReminders();
render();
